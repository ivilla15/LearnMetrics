'use client';

import {
  Card,
  Badge,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from '@/components';
import { FadeIn, StaggerContainer, StaggerItem, HoverLift } from '../components/MotionWrapper';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for trying out LearnMetrics',
    features: ['1 teacher account', '1 classroom', '1 weekly schedule', 'Unlimited students'],
    cta: 'Start free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For teachers managing multiple classes',
    features: [
      '1 teacher account',
      'Up to 5 classrooms',
      'Up to 5 schedules',
      'Priority support',
      'Advanced analytics',
    ],
    cta: 'Upgrade',
    popular: true,
  },
  {
    name: 'School',
    price: 'Custom',
    description: 'For entire schools and districts',
    features: [
      'Multiple teacher accounts',
      'Unlimited classrooms',
      'Custom integrations',
      'Dedicated support',
      'Admin dashboard',
    ],
    cta: 'Contact us',
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 sm:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Pricing
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>
        </FadeIn>

        <StaggerContainer
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
          staggerDelay={0.15}
        >
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <HoverLift>
                <Card
                  className={`h-full relative ${
                    plan.popular
                      ? 'border-accent shadow-lg ring-1 ring-accent/20'
                      : 'border-border/50'
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white border-0">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm">
                          <Check className="w-4 h-4 text-accent shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full rounded-full ${
                        plan.popular ? 'bg-accent hover:bg-accent/90 text-white' : ''
                      }`}
                      variant={plan.popular ? 'primary' : 'outline'}
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
