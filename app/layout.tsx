import './global.css';
import { Metadata } from 'next';
import { ToastProvider } from '@/components/ToastProvider';

export const metadata: Metadata = {
  title: {
    template: '%s | LearnMetrics Dashboard',
    default: 'LearnMetrics Dashboard',
  },
  description: 'The official Next.js Learn Dashboard built with App Router.',
  metadataBase: new URL('https://learn-metrics.ivilla.dev/'),
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
