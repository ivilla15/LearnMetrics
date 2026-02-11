// components/Footer.tsx
import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib';

type FooterVariant = 'default' | 'muted' | 'brand-soft' | 'brand-solid';

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

type FooterProps = {
  className?: string;

  /**
   * default: transparent bg, top border
   * muted: surface bg
   * brand-soft: bg-[hsl(var(--brand)/0.10)]  ✅ (matches your success band soft brand)
   * brand-solid: bg-[hsl(var(--brand))] (white text)
   */
  variant?: FooterVariant;

  /**
   * Optional links (Privacy, Terms, Contact, etc.)
   * If not provided, footer just shows copyright.
   */
  links?: FooterLink[];

  /**
   * Override the brand label in the copyright line.
   * Defaults to "LearnMetrics".
   */
  brandName?: string;

  /**
   * If true, use ™ after brandName in the footer line.
   */
  showTrademark?: boolean;
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function Footer({
  className,
  variant = 'default',
  links,
  brandName = 'LearnMetrics',
  showTrademark = false,
}: FooterProps) {
  const year = new Date().getFullYear();

  const variantStyles: Record<FooterVariant, string> = {
    default: 'bg-transparent border-t border-[hsl(var(--border))] text-[hsl(var(--muted-fg))]',
    muted:
      'bg-[hsl(var(--surface))] border-t border-[hsl(var(--border))] text-[hsl(var(--muted-fg))]',
    'brand-soft':
      'bg-[hsl(var(--brand)/0.10)] border-t border-[hsl(var(--brand)/0.18)] text-[hsl(var(--muted-fg))]',
    'brand-solid': 'bg-[hsl(var(--brand))] border-t border-[hsl(var(--brand))] text-white',
  };

  const linkBase =
    variant === 'brand-solid'
      ? 'text-white/90 hover:text-white'
      : 'text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--fg))]';

  const dot = variant === 'brand-solid' ? <span className="text-white/40">·</span> : <span>·</span>;

  const brandLabel = `${brandName}${showTrademark ? '™' : ''}`;

  return (
    <footer className={cn('w-full', variantStyles[variant], className)}>
      <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:py-12">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div
            className={cn(
              'text-xs leading-relaxed',
              variant === 'brand-solid' ? 'text-white/90' : 'text-[hsl(var(--muted-fg))]',
            )}
          >
            © {year} {brandLabel}. All rights reserved.
          </div>

          {links && links.length > 0 ? (
            <nav
              aria-label="Footer links"
              className="flex flex-wrap items-center justify-center gap-2 text-xs"
            >
              {links.map((l, idx) => {
                const external = l.external ?? isExternalHref(l.href);

                return (
                  <React.Fragment key={`${l.href}-${l.label}`}>
                    {idx !== 0 ? dot : null}

                    {external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className={cn('underline underline-offset-4', linkBase)}
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className={cn('underline underline-offset-4', linkBase)}>
                        {l.label}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
