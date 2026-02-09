'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components';
import { LearnMetricsLogo } from './LearnMetricsLogo';

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
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4
           bg-black/60 backdrop-blur-md
           border-b border-white/10"
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <LearnMetricsLogo variant="full-white" href="/" />

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-white hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm text-white hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="#about" className="text-sm text-white hover:text-white transition-colors">
            About
          </Link>
        </div>

        {/* Auth CTAs */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-white hover:text-white"
                href={secondaryLink.href}
              >
                {secondaryLink.label}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="bg-primary text-white rounded-full hover:bg-primary/90 px-4 border-white/0"
                href={primaryLink.href}
              >
                {primaryLink.label}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-white hover:text-white"
                href={secondaryLink.href}
              >
                {secondaryLink.label}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="bg-primary text-white hover:bg-primary/90 rounded-full px-4 border-white/0"
                href={primaryLink.href}
              >
                {primaryLink.label}
              </Button>
            </>
          )}
        </div>
      </nav>
    </motion.header>
  );
}
