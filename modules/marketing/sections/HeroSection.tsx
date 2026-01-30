'use client';

import { Button } from '@/components';
import { motion } from 'framer-motion';
import { FadeIn } from '../components/MotionWrapper';
import { HeroSectionMobile } from './HeroSectionMobile';

export function HeroSection() {
  return (
    <>
      {/* Mobile-only hero */}
      <section className="md:hidden">
        <HeroSectionMobile />
      </section>

      {/* Desktop/tablet hero */}
      <section className="hidden md:block relative min-h-screen bg-[#0A0A0B] text-white overflow-hidden">
        {/* HERO ILLUSTRATION LAYER (right-weighted, no text) */}
        <div className="absolute inset-0">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-linear-to-br from-[#0A0A0B] via-[#12121A] to-[#0A0A0B]" />

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <svg width="100%" height="100%" aria-hidden="true">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Large background glow - top right */}
          <motion.div
            className="absolute top-0 right-[10%] w-130 h-130 sm:w-150 sm:h-150 rounded-full"
            style={{
              background:
                'radial-gradient(circle, hsl(var(--brand) / 0.18) 0%, hsl(var(--brand) / 0) 70%)',
              filter: 'blur(60px)',
            }}
            animate={{ opacity: [0.4, 0.65, 0.4], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Background glow - center right */}
          <motion.div
            className="absolute top-1/2 right-[20%] w-[320px] h-80 sm:w-100 sm:h-100 rounded-full"
            style={{
              background:
                'radial-gradient(circle, hsl(var(--brand) / 0.12) 0%, hsl(var(--brand) / 0) 70%)',
              filter: 'blur(50px)',
            }}
            animate={{ opacity: [0.3, 0.55, 0.3], y: [-20, 20, -20] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Main illustration container - right-weighted */}
          <div className="absolute inset-0 flex items-center justify-end pr-[6%] sm:pr-[8%]">
            <div className="relative w-[62%] sm:w-[55%] h-[70%] sm:h-[75%]">
              {/* Background card - largest */}
              <motion.div
                className="absolute top-[5%] right-[15%] w-70 h-52.5 sm:w-[320px] sm:h-60 rounded-lg"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(20, 20, 30, 0.6) 0%, rgba(15, 15, 25, 0.4) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 0 40px hsl(var(--brand) / 0.12)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                {/* Progress bars */}
                <div className="p-6 space-y-4">
                  {[0.75, 0.6, 0.85, 0.5].map((width, i) => (
                    <motion.div
                      key={i}
                      className="h-2 rounded-full bg-white/5 overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background:
                            'linear-gradient(90deg, hsl(var(--brand) / 0.65) 0%, rgba(0, 150, 255, 0.35) 100%)',
                          boxShadow: '0 0 10px hsl(var(--brand) / 0.45)',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${width * 100}%` }}
                        transition={{ duration: 1.2, delay: 0.6 + i * 0.1, ease: 'easeOut' }}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Mini grid */}
                <div className="absolute bottom-6 right-6 grid grid-cols-4 gap-2 opacity-20">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-sm bg-white/30"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 0.3, scale: 1 }}
                      transition={{ delay: 1 + i * 0.05 }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Chart-like stepped visualization */}
              <motion.div
                className="absolute bottom-[8%] right-[5%] w-60 h-45 sm:w-70 sm:h-50 rounded-lg"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(22, 22, 32, 0.85) 0%, rgba(14, 14, 22, 0.65) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                  boxShadow: '0 8px 24px hsl(var(--brand) / 0.08)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
              >
                <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between gap-2">
                  {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.65].map((height, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t"
                      style={{
                        background:
                          i === 3 || i === 5
                            ? 'linear-gradient(180deg, hsl(var(--brand) / 0.55) 0%, hsl(var(--brand) / 0.20) 100%)'
                            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0.03) 100%)',
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${height * 120}px` }}
                      transition={{ duration: 0.8, delay: 0.8 + i * 0.1, ease: 'easeOut' }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Floating card - top */}
              <motion.div
                className="absolute top-[15%] right-[45%] w-40 h-31.25 sm:w-45 sm:h-35 rounded-lg"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(22, 22, 32, 0.5) 0%, rgba(16, 16, 24, 0.3) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(15px)',
                  boxShadow: '0 0 25px hsl(var(--brand) / 0.08)',
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                {/* Circular indicator */}
                <div className="absolute top-6 left-6 w-16 h-16">
                  <svg viewBox="0 0 64 64" className="transform -rotate-90" aria-hidden="true">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="3"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="hsl(var(--brand) / 0.65)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 175.93' }}
                      animate={{ strokeDasharray: '132 175.93' }}
                      transition={{ duration: 1.5, delay: 0.7, ease: 'easeOut' }}
                      style={{ filter: 'drop-shadow(0 0 8px hsl(var(--brand) / 0.45))' }}
                    />
                  </svg>
                </div>

                {/* Small indicators */}
                <div className="absolute bottom-5 left-6 right-6 space-y-2">
                  <motion.div
                    className="h-1.5 rounded-full bg-white/5 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, hsl(var(--brand) / 0.45) 0%, hsl(var(--brand) / 0.30) 100%)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: '70%' }}
                      transition={{ duration: 1, delay: 1.2 }}
                    />
                  </motion.div>
                  <motion.div
                    className="h-1.5 rounded-full bg-white/5 overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, hsl(var(--brand) / 0.45) 0%, hsl(var(--brand) / 0.30) 100%)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: '90%' }}
                      transition={{ duration: 1, delay: 1.3 }}
                    />
                  </motion.div>
                </div>
              </motion.div>

              {/* Small accent card */}
              <motion.div
                className="absolute bottom-[35%] right-[50%] w-31.25 h-22.5 sm:w-35 sm:h-25 rounded-lg"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(20, 20, 30, 0.4) 0%, rgba(14, 14, 22, 0.3) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(12px)',
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <div className="p-4 grid grid-cols-5 gap-2">
                  {Array.from({ length: 15 }).map((_, i) => {
                    const isHighlighted = [2, 7, 8, 12, 13].includes(i);
                    return (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: isHighlighted
                            ? 'hsl(var(--brand) / 0.65)'
                            : 'rgba(255, 255, 255, 0.10)',
                          boxShadow: isHighlighted ? '0 0 8px hsl(var(--brand) / 0.45)' : 'none',
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 + i * 0.03 }}
                      />
                    );
                  })}
                </div>
              </motion.div>

              {/* Abstract connector */}
              <motion.svg
                className="absolute top-[30%] right-[35%] w-50 h-30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                transition={{ duration: 1.5, delay: 1.5 }}
                aria-hidden="true"
              >
                <motion.path
                  d="M 0 60 Q 50 20, 100 40 T 200 30"
                  fill="none"
                  stroke="hsl(var(--brand) / 0.45)"
                  strokeWidth="1"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 1.5, ease: 'easeInOut' }}
                  style={{ filter: 'drop-shadow(0 0 4px hsl(var(--brand) / 0.35))' }}
                />
                <motion.circle
                  cx="100"
                  cy="40"
                  r="3"
                  fill="hsl(var(--brand) / 0.85)"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.5 }}
                  style={{ filter: 'drop-shadow(0 0 6px hsl(var(--brand) / 0.65))' }}
                />
                <motion.circle
                  cx="200"
                  cy="30"
                  r="3"
                  fill="hsl(var(--brand) / 0.85)"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 2.7 }}
                  style={{ filter: 'drop-shadow(0 0 6px hsl(var(--brand) / 0.65))' }}
                />
              </motion.svg>

              {/* Floating particles */}
              {[
                { top: '10%', right: '8%', delay: 2 },
                { top: '45%', right: '2%', delay: 2.2 },
                { top: '70%', right: '38%', delay: 2.4 },
              ].map((pos, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    ...pos,
                    background: 'hsl(var(--brand) / 0.65)',
                    boxShadow: '0 0 8px hsl(var(--brand) / 0.65)',
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], y: [0, -10, -10, -20] }}
                  transition={{ duration: 3, delay: pos.delay, repeat: Infinity, repeatDelay: 2 }}
                />
              ))}
            </div>
          </div>

          {/* Subtle vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.45) 100%)',
            }}
          />
        </div>

        {/* CONTENT LAYER */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24 flex flex-col items-start justify-center min-h-screen">
          <FadeIn delay={0.1}>
            <span className="inline-block px-4 py-1.5 mb-8 text-sm font-medium bg-primary rounded-full border border-white/10">
              For Teachers
            </span>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-3xl leading-[1.08] text-balance">
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
              <Button variant="primary" size="lg">
                Get Started
              </Button>
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
