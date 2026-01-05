import Link from 'next/link';

export function StudentNav() {
  return (
    <header className="border-b border-white/10 bg-black/90">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        {/* Left side */}
        <div className="flex items-center gap-5">
          <Link href="/" className="text-sm font-semibold text-white hover:opacity-90">
            LearnMetrics
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link href="/student/dashboard" className="text-slate-300 hover:text-white">
              Dashboard
            </Link>

            <Link href="/student/progress" className="text-slate-300 hover:text-white">
              Progress
            </Link>
          </nav>
        </div>

        {/* Right side */}
        <Link
          href="/student/logout"
          className="rounded-lg border border-white/10 px-3 py-1 text-sm text-slate-200 hover:bg-white/10 hover:text-white"
        >
          Logout
        </Link>
      </div>
    </header>
  );
}
