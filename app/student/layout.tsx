// app/student/layout.tsx
import type { ReactNode } from 'react';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">{children}</div>
    </div>
  );
}
