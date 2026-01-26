'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components';

interface NavLink {
  href: string;
  label: string;
}

interface TopNavProps {
  primaryLink: NavLink;
  secondaryLink: NavLink;
  isLoggedIn: boolean;
}

export function TopNav({ primaryLink, secondaryLink, isLoggedIn }: TopNavProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 text-[#0a0a0a]"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">LearnMetrics</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <Link href="#about" className="text-sm text-white/70 hover:text-white transition-colors">
            About
          </Link>
        </div>

        {/* Auth CTAs */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <Link href={secondaryLink.href}>{secondaryLink.label}</Link>
              </Button>
              <Button size="sm" className="bg-white text-black hover:bg-white/90 rounded-full px-4">
                <Link href={primaryLink.href}>{primaryLink.label}</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <Link href={secondaryLink.href}>{secondaryLink.label}</Link>
              </Button>
              <Button size="sm" className="bg-white text-black hover:bg-white/90 rounded-full px-4">
                <Link href={primaryLink.href}>{primaryLink.label}</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </motion.header>
  );
}
