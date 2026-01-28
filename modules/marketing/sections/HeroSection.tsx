'use client';

import { Button } from '@/components';
import { motion } from 'framer-motion';
import { FadeIn } from '../components/MotionWrapper';

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-1/2 -right-1/4 w-200 h-200 bg-accent/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-1/4 -left-1/4 w-150 h-150 bg-accent/5 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24 flex flex-col items-center justify-center min-h-screen text-center">
        <FadeIn delay={0.1}>
          <span className="inline-block px-4 py-1.5 mb-8 text-sm font-medium bg-white/10 rounded-full border border-white/10">
            For Teachers
          </span>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1] text-balance">
            Automated Weekly Mastery, Without the Busywork
          </h1>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="mt-8 text-lg sm:text-xl text-white/70 max-w-2xl leading-relaxed text-pretty">
            LearnMetrics helps teachers run automatic weekly math assessments, track mastery, and
            spot gaps — without spreadsheets or manual grading.
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90 px-8 h-12 text-base font-medium rounded-full"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 hover:text-white px-8 h-12 text-base font-medium rounded-full bg-transparent"
            >
              View Demo
            </Button>
          </div>
        </FadeIn>

        {/* Decorative grid */}
        <FadeIn delay={0.5} className="mt-20 w-full max-w-3xl">
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 overflow-hidden">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="h-16 rounded-lg bg-white/5 border border-white/5"
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a] via-transparent to-transparent" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
