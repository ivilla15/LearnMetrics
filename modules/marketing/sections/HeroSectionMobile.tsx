// HeroSectionMobile.tsx
'use client';

import { Button } from '@/components';
import { motion } from 'framer-motion';
import { FadeIn } from '../components/MotionWrapper';

export function HeroSectionMobile() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#0A0A0B] text-white md:hidden">
      {/* Background illustration (your 9:16 card) */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div
          className="w-full max-w-[380px] relative overflow-hidden rounded-2xl"
          style={{ aspectRatio: '9 / 16' }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0B] via-[#12121A] to-[#0A0A0B]" />

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]">
            <svg width="100%" height="100%" aria-hidden="true">
              <defs>
                <pattern id="grid-mobile" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-mobile)" />
            </svg>
          </div>

          {/* Background glow - top */}
          <motion.div
            className="absolute top-[10%] left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(0, 112, 243, 0.12) 0%, rgba(0, 112, 243, 0) 70%)',
              filter: 'blur(50px)',
            }}
            animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.15, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Background glow - middle */}
          <motion.div
            className="absolute top-[45%] left-1/2 h-[250px] w-[250px] -translate-x-1/2 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(0, 112, 243, 0.08) 0%, rgba(0, 112, 243, 0) 70%)',
              filter: 'blur(40px)',
            }}
            animate={{ opacity: [0.3, 0.5, 0.3], y: [-15, 15, -15] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Main content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 px-6 py-8">
            {/* Top card */}
            <motion.div
              className="relative h-[160px] w-full max-w-[280px] rounded-xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(20, 20, 30, 0.6) 0%, rgba(15, 15, 25, 0.4) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 30px rgba(0, 112, 243, 0.08)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="space-y-3 p-5">
                {[0.8, 0.65, 0.9, 0.55].map((width, i) => (
                  <motion.div
                    key={i}
                    className="h-2 overflow-hidden rounded-full bg-white/5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, rgba(0, 112, 243, 0.6) 0%, rgba(0, 150, 255, 0.35) 100%)',
                        boxShadow: '0 0 8px rgba(0, 112, 243, 0.4)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${width * 100}%` }}
                      transition={{ duration: 1, delay: 0.6 + i * 0.08, ease: 'easeOut' }}
                    />
                  </motion.div>
                ))}
              </div>

              <div className="absolute bottom-4 right-5 grid grid-cols-3 gap-1.5 opacity-20">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-2.5 w-2.5 rounded-sm bg-white/30"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.3, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.04 }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Middle row */}
            <div className="flex w-full max-w-[280px] gap-4">
              <motion.div
                className="relative h-[140px] flex-1 rounded-xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(18, 18, 28, 0.5) 0%, rgba(14, 14, 22, 0.3) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(15px)',
                  boxShadow: '0 0 20px rgba(0, 112, 243, 0.06)',
                }}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2">
                  <svg viewBox="0 0 64 64" className="-rotate-90" aria-hidden="true">
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="2.5"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="rgba(0, 112, 243, 0.6)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 163.36' }}
                      animate={{ strokeDasharray: '122 163.36' }}
                      transition={{ duration: 1.5, delay: 0.7, ease: 'easeOut' }}
                      style={{ filter: 'drop-shadow(0 0 6px rgba(0, 112, 243, 0.4))' }}
                    />
                  </svg>
                </div>
              </motion.div>

              <motion.div
                className="relative h-[140px] flex-1 rounded-xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(18, 18, 28, 0.5) 0%, rgba(14, 14, 22, 0.3) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(15px)',
                }}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 grid-cols-4 gap-2.5">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const isHighlighted = [1, 5, 6, 9, 10].includes(i);
                    return (
                      <motion.div
                        key={i}
                        className="h-2 w-2 rounded-full"
                        style={{
                          background: isHighlighted
                            ? 'rgba(0, 112, 243, 0.7)'
                            : 'rgba(255, 255, 255, 0.12)',
                          boxShadow: isHighlighted ? '0 0 8px rgba(0, 112, 243, 0.5)' : 'none',
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + i * 0.03 }}
                      />
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Bottom chart */}
            <motion.div
              className="relative h-[180px] w-full max-w-[280px] rounded-xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(18, 18, 26, 0.7) 0%, rgba(12, 12, 20, 0.5) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 30px rgba(0, 112, 243, 0.08)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-2 p-5">
                {[0.35, 0.65, 0.45, 0.85, 0.55, 0.75, 0.6].map((height, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{
                      background:
                        i === 3 || i === 5
                          ? 'linear-gradient(180deg, rgba(0, 112, 243, 0.5) 0%, rgba(0, 112, 243, 0.2) 100%)'
                          : 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%)',
                      boxShadow: i === 3 || i === 5 ? '0 0 12px rgba(0, 112, 243, 0.3)' : 'none',
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${height * 110}px` }}
                    transition={{ duration: 0.8, delay: 1 + i * 0.08, ease: 'easeOut' }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Vertical indicators */}
            <motion.div
              className="relative h-[120px] w-full max-w-[280px] rounded-xl"
              style={{
                background:
                  'linear-gradient(135deg, rgba(20, 20, 30, 0.5) 0%, rgba(14, 14, 22, 0.3) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(15px)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="absolute inset-0 flex items-center justify-around p-5">
                {[0.6, 0.85, 0.7, 0.9, 0.65].map((height, i) => (
                  <div key={i} className="flex h-full flex-col items-center justify-end gap-2">
                    <motion.div
                      className="w-8 rounded-t-sm"
                      style={{
                        background:
                          i === 1 || i === 3
                            ? 'linear-gradient(180deg, rgba(0, 112, 243, 0.5) 0%, rgba(0, 112, 243, 0.2) 100%)'
                            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                        boxShadow: i === 1 || i === 3 ? '0 0 10px rgba(0, 112, 243, 0.3)' : 'none',
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${height * 60}px` }}
                      transition={{ duration: 0.8, delay: 1.2 + i * 0.1, ease: 'easeOut' }}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Connecting line */}
          <motion.svg
            className="absolute top-[28%] left-1/2 h-[100px] w-[200px] -translate-x-1/2 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 1.5, delay: 1.8 }}
            aria-hidden="true"
          >
            <motion.path
              d="M 100 10 Q 120 40, 100 70"
              fill="none"
              stroke="rgba(0, 112, 243, 0.4)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, delay: 1.8, ease: 'easeInOut' }}
              style={{ filter: 'drop-shadow(0 0 3px rgba(0, 112, 243, 0.3))' }}
            />
          </motion.svg>

          {/* Floating particles */}
          {[
            { top: '15%', left: '15%', delay: 2 },
            { top: '42%', left: '82%', delay: 2.3 },
            { top: '68%', left: '20%', delay: 2.6 },
          ].map((pos, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full"
              style={{
                ...pos,
                background: 'rgba(0, 112, 243, 0.6)',
                boxShadow: '0 0 6px rgba(0, 112, 243, 0.6)',
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0, 1, 1, 0],
                y: [0, -15, -15, -30],
              }}
              transition={{
                duration: 3,
                delay: pos.delay,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />
          ))}

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.5) 100%)',
            }}
          />
        </div>
      </div>

      {/* Scrim so text is always readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-black/70" />

      {/* Foreground content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-end px-6 pb-10 pt-24 text-center">
        <FadeIn delay={0.1}>
          <span className="mb-6 inline-block rounded-full border border-white/10 bg-primary px-4 py-1.5 text-sm font-medium">
            For Teachers
          </span>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h1 className="text-balance text-4xl font-bold leading-[1.08]">
            Automated Weekly Mastery, Without the Busywork
          </h1>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-white/75">
            LearnMetrics helps teachers run automatic weekly math assessments, track mastery, and
            spot gaps — without spreadsheets or manual grading.
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
