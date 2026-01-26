'use client';

import { TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/MotionWrapper';

const stats = [
  {
    icon: TrendingUp,
    value: '87%',
    label: 'Mastery Rate',
    trend: '+12% this month',
  },
  {
    icon: AlertTriangle,
    value: '4',
    label: 'At-Risk Students',
    trend: 'Need attention',
  },
  {
    icon: Activity,
    value: '+23%',
    label: 'Recent Improvement',
    trend: 'Class average',
  },
];

export function InsightsSection() {
  return (
    <section className="py-24 sm:py-32 bg-primary text-white">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              See What Your Students Actually Know
            </h2>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              Stop guessing about student understanding. LearnMetrics provides clear, actionable
              insights so you can focus your teaching where it matters most.
            </p>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.15}>
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-lg font-medium mb-1">{stat.label}</div>
                <div className="text-sm text-white/60">{stat.trend}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
