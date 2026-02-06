// app/api/billing/webhook/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/data/prisma';
import { handleApiError } from '../../_shared';
import { TeacherPlan } from '@prisma/client';

export const runtime = 'nodejs';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function normalizeCustomerId(
  maybe: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
): string | null {
  if (!maybe) return null;
  return typeof maybe === 'string' ? maybe : (maybe.id ?? null);
}

function normalizeTeacherPlan(raw?: string | null): TeacherPlan {
  switch ((raw ?? '').toUpperCase()) {
    case 'PRO':
      return TeacherPlan.PRO;
    case 'SCHOOL':
      return TeacherPlan.SCHOOL;
    case 'TRIAL':
      return TeacherPlan.TRIAL;
    default:
      return TeacherPlan.PRO; // safe default
  }
}

async function upsertEntitlementForTeacher(
  teacherId: number,
  opts: {
    plan?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  },
) {
  const planEnum = normalizeTeacherPlan(opts.plan);
  const now = new Date();

  const existing = await prisma.teacherEntitlement.findUnique({ where: { teacherId } });
  if (existing) {
    return prisma.teacherEntitlement.update({
      where: { teacherId },
      data: {
        plan: planEnum,
        status: 'ACTIVE',
        trialEndsAt: null,
        stripeCustomerId: opts.stripeCustomerId ?? existing.stripeCustomerId,
        stripeSubscriptionId: opts.stripeSubscriptionId ?? existing.stripeSubscriptionId,
        updatedAt: now,
      },
    });
  } else {
    return prisma.teacherEntitlement.create({
      data: {
        teacherId,
        plan: planEnum,
        status: 'ACTIVE',
        trialEndsAt: null,
        stripeCustomerId: opts.stripeCustomerId ?? undefined,
        stripeSubscriptionId: opts.stripeSubscriptionId ?? undefined,
      },
    });
  }
}

async function markEntitlementCanceledOrExpiredByTeacherId(
  teacherId: number,
  kind: 'CANCELED' | 'EXPIRED',
) {
  const now = new Date();
  const existing = await prisma.teacherEntitlement.findUnique({ where: { teacherId } });
  if (existing) {
    await prisma.teacherEntitlement.update({
      where: { teacherId },
      data: { status: kind, trialEndsAt: now },
    });
  } else {
    await prisma.teacherEntitlement.create({
      data: {
        teacherId,
        plan: 'TRIAL',
        status: kind,
        trialEndsAt: now,
      },
    });
  }

  const classroomIds = (
    await prisma.classroom.findMany({
      where: { teacherId },
      select: { id: true },
    })
  ).map((c) => c.id);

  if (classroomIds.length) {
    await prisma.assignmentSchedule.updateMany({
      where: { classroomId: { in: classroomIds } },
      data: { isActive: false },
    });
  }
}

async function findTeacherIdFromSubscription(subscription: Stripe.Subscription) {
  // 1) try metadata.teacherId
  const metaTid = subscription.metadata?.teacherId;
  if (metaTid) {
    const tid = Number(metaTid);
    if (!Number.isNaN(tid)) return tid;
  }

  // 2) try to find entitlement row by stripeSubscriptionId
  const ent = await prisma.teacherEntitlement.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    select: { teacherId: true },
  });
  if (ent) return ent.teacherId;

  // 3) try to find teacher by stripeCustomerId
  const cust = subscription.customer;
  const customerId = normalizeCustomerId(cust);
  if (customerId) {
    const ent2 = await prisma.teacherEntitlement.findFirst({
      where: { stripeCustomerId: customerId },
      select: { teacherId: true },
    });
    if (ent2) return ent2.teacherId;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    if (!WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET env var');
      return new NextResponse('Missing webhook secret', { status: 500 });
    }

    const buf = await req.arrayBuffer();
    const rawBody = Buffer.from(buf);
    const sig = req.headers.get('stripe-signature') ?? '';
    if (!sig) {
      console.warn('No stripe-signature header present');
      return new NextResponse('Missing signature', { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
    } catch (err: unknown) {
      console.error(
        'Webhook signature verification failed:',
        err instanceof Error ? err.message : err,
      );
      return new NextResponse('Invalid signature', { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        let teacherId: number | null = null;
        const metaTid = session.metadata?.teacherId;
        if (metaTid) {
          const t = Number(metaTid);
          if (!Number.isNaN(t)) teacherId = t;
        }

        let subscription: Stripe.Subscription | null = null;
        if (!teacherId && session.subscription) {
          try {
            subscription = await stripe.subscriptions.retrieve(String(session.subscription));
            const metaSubTid = subscription.metadata?.teacherId;
            if (metaSubTid) {
              const t = Number(metaSubTid);
              if (!Number.isNaN(t)) teacherId = t;
            }
          } catch (err) {
            console.warn('Failed to retrieve subscription for checkout.session.completed:', err);
          }
        }

        if (!teacherId && session.customer_email) {
          const teacher = await prisma.teacher.findUnique({
            where: { email: session.customer_email.toLowerCase() },
            select: { id: true },
          });
          if (teacher) teacherId = teacher.id;
        }

        if (!teacherId && subscription) {
          const ent = await prisma.teacherEntitlement.findFirst({
            where: { stripeSubscriptionId: subscription.id },
            select: { teacherId: true },
          });
          if (ent) teacherId = ent.teacherId;
        }

        if (!teacherId) {
          console.warn('checkout.session.completed: could not determine teacherId, skipping', {
            sessionId: session.id,
            metadata: session.metadata,
            subscriptionId: session.subscription,
            email: session.customer_email,
          });
          break;
        }

        const planFromMeta = (
          session.metadata?.plan ??
          subscription?.metadata?.plan ??
          'PRO'
        ).toUpperCase();

        const stripeCustomerId = normalizeCustomerId(session.customer ?? subscription?.customer);
        const stripeSubscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : (subscription?.id ?? null);

        await upsertEntitlementForTeacher(teacherId, {
          plan: planFromMeta,
          stripeCustomerId,
          stripeSubscriptionId,
        });

        console.info(`checkout.session.completed: granted ${planFromMeta} to teacher ${teacherId}`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        const teacherId = await findTeacherIdFromSubscription(subscription);
        if (!teacherId) {
          console.warn(
            'subscription.updated: no teacherId found in metadata/entitlement',
            subscription.id,
          );
          break;
        }

        const status = subscription.status;
        if (status === 'active' || status === 'trialing') {
          const planFromMeta = (subscription.metadata?.plan ?? 'PRO').toUpperCase();
          const stripeCustomerId = normalizeCustomerId(subscription.customer);
          await upsertEntitlementForTeacher(teacherId, {
            plan: planFromMeta,
            stripeCustomerId,
            stripeSubscriptionId: subscription.id,
          });
          console.info(
            `subscription.updated: set teacher ${teacherId} entitlement ACTIVE (sub ${subscription.id})`,
          );
        } else if (status === 'canceled' || status === 'unpaid') {
          await markEntitlementCanceledOrExpiredByTeacherId(teacherId, 'EXPIRED');
          console.info(
            `subscription.updated: marked teacher ${teacherId} EXPIRED (sub ${subscription.id} status ${status})`,
          );
        } else {
          console.info(
            `subscription.updated: no action for status=${status} for teacher ${teacherId}`,
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const teacherId = await findTeacherIdFromSubscription(subscription);
        if (!teacherId) {
          console.warn('subscription.deleted: no teacherId found', subscription.id);
          break;
        }

        await markEntitlementCanceledOrExpiredByTeacherId(teacherId, 'CANCELED');
        console.info(
          `subscription.deleted: marked teacher ${teacherId} CANCELED and deactivated their schedules`,
        );
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return new NextResponse('ok', { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
