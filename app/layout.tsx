import './global.css';
import { ToastProvider } from '@/components/ToastProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'LearnMetrics',
    template: '%s | LearnMetrics',
  },

  description:
    'LearnMetrics helps educators track, measure, and understand student learning progress through clear, actionable metrics.',

  applicationName: 'LearnMetrics',

  metadataBase: new URL('https://learn-metrics.ivilla.dev/'),

  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },

  openGraph: {
    type: 'website',
    siteName: 'LearnMetrics',
    title: 'LearnMetrics',
    description:
      'Track and measure student learning progress with clear, data-driven insights built for educators.',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'LearnMetrics logo showing growth and progress',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'LearnMetrics',
    description:
      'Track and measure student learning progress with clear, data-driven insights built for educators.',
    images: ['/og.png'],
  },

  robots: {
    index: true,
    follow: true,
  },

  category: 'education',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen w-screen overflow-x-hidden bg-[hsl(var(--bg))]">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
