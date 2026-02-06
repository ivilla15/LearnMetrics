'use client';

import { Button } from '@/components';
import { motion } from 'framer-motion';
import { FadeIn } from '../components/MotionWrapper';

export function FinalCtaSection() {
  return (
    <section className="relative py-24 sm:py-32 bg-[#0a0a0a] text-white overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-accent/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <FadeIn>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-balance">
            Spend less time grading. More time teaching.
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="mt-6 text-lg text-white/70 max-w-xl mx-auto">
            Join thousands of teachers who have reclaimed their time with automated assessments.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Button
            size="lg"
            className="mt-10 bg-white text-black hover:bg-white/90 px-10 h-14 text-lg font-medium rounded-full"
          >
            Get Started Today
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}
