'use client';

import { Card, CardContent } from '@/components';
import { ClipboardCheck, Sparkles, CalendarDays, LineChart, KeyRound, Globe } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, HoverLift } from '../components/MotionWrapper';

const features = [
  {
    icon: ClipboardCheck,
    title: 'Automated weekly tests',
    description:
      'Set it and forget it. Tests deploy on schedule with no manual intervention needed.',
  },
  {
    icon: Sparkles,
    title: 'Smart remediation',
    description: 'AI-powered suggestions help students review exactly what they need to master.',
  },
  {
    icon: CalendarDays,
    title: 'Calendar with upcoming tests',
    description: "Visual overview of your assessment schedule. Students always know what's coming.",
  },
  {
    icon: LineChart,
    title: 'Student progress dashboards',
    description: 'Real-time insights into individual and class-wide performance trends.',
  },
  {
    icon: KeyRound,
    title: 'Zero-friction student login',
    description: 'No passwords, no emails. Students join with a simple class code.',
  },
  {
    icon: Globe,
    title: 'Timezone-aware scheduling',
    description: 'Tests go live at the right time, no matter where your students are located.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Features
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Everything you need to teach smarter
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed to save you time and help students succeed.
            </p>
          </div>
        </FadeIn>

        <StaggerContainer
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          staggerDelay={0.1}
        >
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <HoverLift>
                <Card className="h-full border border-border/50 shadow-none bg-background hover:border-accent/30 transition-colors">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                      <feature.icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
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
