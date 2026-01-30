'use client';

import { motion } from 'framer-motion';
import { FadeIn } from '../components';
import { Button } from '@/components';

export function HeroSectionMobile() {
  return (
    <section className="min-h-screen bg-[#0A0A0B] text-white px-6 pt-24 pb-16">
      <div className="mx-auto max-w-md text-center">
        <FadeIn delay={0.1}>
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium bg-primary rounded-full border border-white/10">
            For Teachers
          </span>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h1 className="text-4xl font-bold leading-[1.08] text-balance">
            Automated Weekly Mastery, Without the Busywork
          </h1>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="mt-6 text-lg text-white/70 leading-relaxed text-pretty">
            LearnMetrics helps teachers run automatic weekly math assessments, track mastery, and
            spot gaps — without spreadsheets or manual grading.
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="mt-8 flex flex-col gap-3">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>
        </FadeIn>
      </div>
      <div className="w-full md:hidden mt-16">
        <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-2xl">
          <div className="relative w-full" style={{ aspectRatio: '9 / 16' }}>
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
              className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full"
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
              className="absolute top-[45%] left-1/2 -translate-x-1/2 w-[250px] h-[250px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(0, 112, 243, 0.08) 0%, rgba(0, 112, 243, 0) 70%)',
                filter: 'blur(40px)',
              }}
              animate={{ opacity: [0.3, 0.5, 0.3], y: [-15, 15, -15] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Main content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 py-8 space-y-6">
              {/* Top card */}
              <motion.div
                className="w-full max-w-[280px] h-[160px] rounded-xl relative"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(20, 20, 30, 0.6) 0%, rgba(15, 15, 25, 0.4) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 0 30px rgba(0, 112, 243, 0.08)',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="p-5 space-y-3">
                  {[0.8, 0.65, 0.9, 0.55].map((width, i) => (
                    <motion.div
                      key={i}
                      className="h-2 rounded-full bg-white/5 overflow-hidden"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
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
                        whileInView={{ width: `${width * 100}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 1,
                          delay: 0.6 + i * 0.08,
                          ease: 'easeOut',
                        }}
                      />
                    </motion.div>
                  ))}
                </div>

                <div className="absolute bottom-4 right-5 grid grid-cols-3 gap-1.5 opacity-20">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2.5 h-2.5 rounded-sm bg-white/30"
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 0.3, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.9 + i * 0.04 }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Middle row */}
              <div className="w-full max-w-[280px] flex gap-4">
                <motion.div
                  className="flex-1 h-[140px] rounded-xl relative"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(18, 18, 28, 0.5) 0%, rgba(14, 14, 22, 0.3) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(15px)',
                    boxShadow: '0 0 20px rgba(0, 112, 243, 0.06)',
                  }}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16">
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
                        whileInView={{ strokeDasharray: '122 163.36' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: 0.7, ease: 'easeOut' }}
                        style={{ filter: 'drop-shadow(0 0 6px rgba(0, 112, 243, 0.4))' }}
                      />
                    </svg>
                  </div>
                </motion.div>

                <motion.div
                  className="flex-1 h-[140px] rounded-xl relative"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(18, 18, 28, 0.5) 0%, rgba(14, 14, 22, 0.3) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(15px)',
                  }}
                  initial={{ opacity: 0, x: 15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-4 gap-2.5">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const isHighlighted = [1, 5, 6, 9, 10].includes(i);
                      return (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: isHighlighted
                              ? 'rgba(0, 112, 243, 0.7)'
                              : 'rgba(255, 255, 255, 0.12)',
                            boxShadow: isHighlighted ? '0 0 8px rgba(0, 112, 243, 0.5)' : 'none',
                          }}
                          initial={{ opacity: 0, scale: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 1 + i * 0.03 }}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Bottom chart */}
              <motion.div
                className="w-full max-w-[280px] h-[180px] rounded-xl relative"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(18, 18, 26, 0.7) 0%, rgba(12, 12, 20, 0.5) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 0 30px rgba(0, 112, 243, 0.08)',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between gap-2">
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
                      whileInView={{ height: `${height * 110}px` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.8,
                        delay: 1 + i * 0.08,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Vertical indicators */}
              <motion.div
                className="w-full max-w-[280px] h-[120px] rounded-xl relative"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(20, 20, 30, 0.5) 0%, rgba(14, 14, 22, 0.3) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(15px)',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <div className="absolute inset-0 p-5 flex items-center justify-around">
                  {[0.6, 0.85, 0.7, 0.9, 0.65].map((height, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                      <motion.div
                        className="w-8 rounded-t-sm"
                        style={{
                          background:
                            i === 1 || i === 3
                              ? 'linear-gradient(180deg, rgba(0, 112, 243, 0.5) 0%, rgba(0, 112, 243, 0.2) 100%)'
                              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                          boxShadow:
                            i === 1 || i === 3 ? '0 0 10px rgba(0, 112, 243, 0.3)' : 'none',
                        }}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${height * 60}px` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.8,
                          delay: 1.2 + i * 0.1,
                          ease: 'easeOut',
                        }}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Connecting line */}
            <motion.svg
              className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[200px] h-[100px] pointer-events-none"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.25 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 1.8 }}
              aria-hidden="true"
            >
              <motion.path
                d="M 100 10 Q 120 40, 100 70"
                fill="none"
                stroke="rgba(0, 112, 243, 0.4)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
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
                className="absolute w-1 h-1 rounded-full"
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
      </div>
    </section>
  );
}
