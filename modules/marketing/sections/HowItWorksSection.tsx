'use client';

import { Card, CardContent } from '@/components';
import { Users, Calendar, BarChart3 } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, HoverLift } from '../components/MotionWrapper';

const steps = [
  {
    number: '01',
    icon: Users,
    title: 'Create a classroom',
    description:
      'Set up your class in minutes. Add students with zero-friction login — no emails required.',
  },
  {
    number: '02',
    icon: Calendar,
    title: 'Set a weekly schedule',
    description:
      'Choose when assessments go live. Tests deploy automatically based on your timezone.',
  },
  {
    number: '03',
    icon: BarChart3,
    title: 'Track mastery automatically',
    description: 'Watch progress unfold. Spot struggling students before they fall behind.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 sm:py-32 bg-muted">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              How It Works
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Three steps to mastery
            </h2>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.15}>
          {steps.map((step) => (
            <StaggerItem key={step.number}>
              <HoverLift>
                <Card className="h-full border-0 shadow-none bg-background">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-4xl font-bold text-muted-foreground/30">
                        {step.number}
                      </span>
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-accent" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
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
