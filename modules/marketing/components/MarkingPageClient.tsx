'use client';

import {
  TopNav,
  HeroSection,
  CreatorSection,
  FeaturesSection,
  FinalCtaSection,
  HowItWorksSection,
  InsightsSection,
  PricingSection,
} from '@/modules/marketing';

interface NavLink {
  href: string;
  label: string;
}

interface MarketingPageClientProps {
  primaryLink: NavLink;
  secondaryLink: NavLink;
  isLoggedIn: boolean;
}

export function MarketingPageClient({
  primaryLink,
  secondaryLink,
  isLoggedIn,
}: MarketingPageClientProps) {
  return (
    <>
      <TopNav primaryLink={primaryLink} secondaryLink={secondaryLink} isLoggedIn={isLoggedIn} />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <InsightsSection />
      <PricingSection />
      <CreatorSection />
      <FinalCtaSection />
    </>
  );
}
