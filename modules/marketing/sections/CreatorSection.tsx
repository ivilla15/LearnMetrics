'use client';

import { Card, CardContent, Button } from '@/components';
import { ArrowRight } from 'lucide-react';
import { FadeIn, HoverLift } from '../components/MotionWrapper';

export function CreatorSection() {
  return (
    <section id="about" className="py-24 sm:py-32 bg-muted">
      <div className="max-w-4xl mx-auto px-6">
        <FadeIn>
          <HoverLift>
            <Card className="border-0 shadow-none bg-background">
              <CardContent className="p-8 sm:p-12">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <span className="text-3xl font-bold text-accent">IV</span>
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                      Meet the Creator
                    </span>
                    <h3 className="mt-2 text-2xl font-bold text-foreground">
                      Built by a real engineer focused on education
                    </h3>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                      LearnMetrics is built hands-on by a developer who understands both code and
                      classrooms. Every feature is designed with teachers in mind, because the best
                      tools come from people who truly care about the problem they&apos;re solving.
                    </p>
                    <Button variant="primary" href="https://www.ivilla.dev/" className="mt-6">
                      Meet the Creator
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </HoverLift>
        </FadeIn>
      </div>
    </section>
  );
}
