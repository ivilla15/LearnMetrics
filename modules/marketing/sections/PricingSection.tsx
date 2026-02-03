'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { Card, CardContent, Button, Badge } from '@/components';
import { FadeIn, StaggerContainer, StaggerItem, HoverLift } from '../components/MotionWrapper';

type Plan = {
  name: string;
  price: string;
  period?: string;
  description: string;
  subDescription?: string;
  features: string[];
  cta: string;
  href?: string;
  popular?: boolean;
};

const plans: Plan[] = [
  {
    name: 'Free Trial',
    price: '$0',
    description: '1 month full access',
    subDescription: 'No credit card required',
    features: [
      'Automated weekly tests',
      'Student progress dashboard',
      'Auto grading',
      'Class-level insights',
      'Email support',
    ],
    cta: 'Start Free Trial',
    href: '/teacher/signup',
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    description: 'For individual teachers',
    subDescription: 'Multiple classrooms + schedules',
    features: [
      'Everything in Free Trial',
      'Multiple classrooms',
      'Multiple schedules per classroom',
      'Upcoming test calendar + edits',
      'Priority support',
      'More analytics over time',
    ],
    cta: 'Get Started',
    href: '/api/billing/checkout?plan=pro',
    popular: true,
  },
  {
    name: 'School',
    price: 'Custom',
    description: 'For schools and districts',
    subDescription: 'Volume pricing available',
    features: [
      'Everything in Pro',
      'Multiple teacher accounts',
      'Admin-level reporting',
      'Centralized onboarding support',
      'Dedicated success contact',
      'Custom rollout planning',
    ],
    cta: 'Contact Sales',
    href: '/contact',
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-[hsl(var(--bg))] py-24 px-6 sm:py-32">
      <div className="mx-auto w-full max-w-7xl">
        <FadeIn>
          <div className="mb-16 text-center sm:mb-20">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl text-[hsl(var(--fg))]">
              LearnMetrics Pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[hsl(var(--muted-fg))] sm:text-xl">
              Automated weekly math mastery assessments and progress tracking built for real
              classrooms.
            </p>
          </div>
        </FadeIn>

        <StaggerContainer
          className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8"
          staggerDelay={0.12}
        >
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <HoverLift>
                <Card
                  className={[
                    'relative flex h-full flex-col rounded-[24px] border bg-[hsl(var(--surface))] h-140',
                    plan.popular
                      ? 'border-[hsl(var(--brand))] shadow-[0_20px_60px_rgba(0,0,0,0.12)]'
                      : 'border-[hsl(var(--border))] shadow-[0_10px_30px_rgba(0,0,0,0.08)]',
                  ].join(' ')}
                >
                  {plan.popular ? (
                    <Badge
                      className="absolute -top-3 left-1/2 -translate-x-1/2 border-0 text-white"
                      style={{ background: 'hsl(var(--brand))' }}
                    >
                      Recommended
                    </Badge>
                  ) : null}

                  <CardContent className="flex h-full flex-col p-8">
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-[hsl(var(--fg))]">{plan.name}</h3>

                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-semibold tracking-tight text-[hsl(var(--fg))]">
                          {plan.price}
                        </span>
                        {plan.period ? (
                          <span className="text-lg text-[hsl(var(--muted-fg))]">{plan.period}</span>
                        ) : null}
                      </div>

                      <p className="mt-4 text-[hsl(var(--muted-fg))]">{plan.description}</p>
                      {plan.subDescription ? (
                        <p className="text-[hsl(var(--muted-fg))]">{plan.subDescription}</p>
                      ) : null}
                    </div>

                    <ul className="mb-8 flex-1 space-y-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check
                            className="mt-0.5 h-5 w-5 shrink-0"
                            style={{ color: 'hsl(var(--brand))' }}
                          />
                          <span className="text-[hsl(var(--fg))] opacity-90">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      href={plan.href ?? '/teacher/signup'}
                      variant={plan.popular ? 'primary' : 'outline'}
                      size="lg"
                      className={[
                        'w-full rounded-xl py-4',
                        plan.popular
                          ? ''
                          : 'border-[hsl(var(--border))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--brand)/0.08)]',
                      ].join(' ')}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </HoverLift>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
