import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireTeacher } from '@/core';
import { jsonError } from '@/utils';
import { readJson, handleApiError } from '@/app';
import { createTeacherClassroom } from '@/core/classrooms/createTeacherClassroom';
import { prisma } from '@/data/prisma';
import { isTrialLocked } from '@/core/entitlements/isTrialLocked';

const CreateClassroomSchema = z.object({
  name: z.string().trim().min(1).max(80),
  timeZone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return jsonError(auth.error, auth.status);

    // Entitlement gate (Trial = 1 classroom total per teacher)
    const ent = await prisma.teacherEntitlement.findUnique({
      where: { teacherId: auth.teacher.id },
      select: { plan: true, status: true, trialEndsAt: true },
    });

    if (isTrialLocked(ent)) {
      return jsonError('Your trial has ended. Upgrade to create new classrooms.', 403);
    }

    if (ent?.plan === 'TRIAL') {
      const classroomCount = await prisma.classroom.count({
        where: { teacherId: auth.teacher.id },
      });

      if (classroomCount >= 1) {
        return jsonError('Trial is limited to 1 classroom. Upgrade to add more.', 403);
      }
    }

    const raw = await readJson(req);
    const { name, timeZone } = CreateClassroomSchema.parse(raw);

    const tz =
      typeof timeZone === 'string' && timeZone.trim().length > 0
        ? timeZone.trim()
        : 'America/Los_Angeles';

    const classroom = await createTeacherClassroom({
      teacherId: auth.teacher.id,
      name,
      timeZone: tz,
    });

    return NextResponse.json({ ok: true, classroom }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
