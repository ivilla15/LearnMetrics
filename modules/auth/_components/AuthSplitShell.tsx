'use client';

import * as React from 'react';
import { Button } from '@/components';

export type AuthMode = 'login' | 'signup';

type Props = {
  mode: AuthMode;
  onChangeMode: (next: AuthMode) => void;

  loginForm: React.ReactNode;
  signupForm: React.ReactNode;

  overlayLogin: {
    title: string;
    body: string;
    cta: string;
    bullets?: string[];
  };

  overlaySignup: {
    title: string;
    body: string;
    cta: string;
    bullets?: string[];
  };
};

function BulletList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="mt-6 space-y-2 text-sm text-white/90">
      {items.map((t, i) => (
        <li key={`${i}-${t}`} className="flex items-start gap-2">
          <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-white/90" />
          <span className="leading-relaxed">{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function AuthSplitShell({
  mode,
  onChangeMode,
  loginForm,
  signupForm,
  overlayLogin,
  overlaySignup,
}: Props) {
  const isSignup = mode === 'signup';

  return (
    <div className="w-full">
      {/* Mobile */}
      <div className="md:hidden space-y-4">
        <div className="flex rounded-[999px] bg-[hsl(var(--surface))] shadow-[0_4px_10px_rgba(0,0,0,0.08)] overflow-hidden gap-5">
          <Button
            onClick={() => onChangeMode('login')}
            className={[
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              !isSignup ? 'bg-[hsl(var(--brand))] text-white' : 'text-[hsl(var(--brand))] bg-white',
            ].join(' ')}
          >
            Sign in
          </Button>
          <Button
            onClick={() => onChangeMode('signup')}
            className={[
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              isSignup ? 'bg-[hsl(var(--brand))] text-white' : 'text-[hsl(var(--brand))] bg-white',
            ].join(' ')}
          >
            Create account
          </Button>
        </div>

        <div className="rounded-[28px] border-0 bg-[hsl(var(--card))] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-5">
          {!isSignup ? loginForm : signupForm}
        </div>

        <div className="rounded-[28px] bg-[hsl(var(--brand))] text-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="text-xl font-semibold">
            {isSignup ? overlaySignup.title : overlayLogin.title}
          </div>
          <div className="mt-2 text-sm text-white/85 leading-relaxed">
            {isSignup ? overlaySignup.body : overlayLogin.body}
          </div>
          <BulletList items={isSignup ? overlaySignup.bullets : overlayLogin.bullets} />
          <div className="mt-6">
            <Button
              variant="secondary"
              className="bg-white text-[hsl(var(--brand))] hover:bg-white/90 w-full"
              onClick={() => onChangeMode(isSignup ? 'login' : 'signup')}
            >
              {isSignup ? overlaySignup.cta : overlayLogin.cta}
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="mx-auto w-full max-w-5xl rounded-[32px] border-0 bg-[hsl(var(--card))] shadow-[0_30px_90px_rgba(0,0,0,0.10)] overflow-hidden">
          <div className="relative grid grid-cols-2 min-h-[560px]">
            {/* Left form column */}
            <div
              className={[
                'p-10 flex flex-col justify-center transition-opacity',
                !isSignup ? 'pointer-events-none opacity-60' : 'pointer-events-auto opacity-100',
              ].join(' ')}
            >
              <div className="flex flex-col justify-evenly flex-1">
                <div>
                  <div className="text-2xl font-semibold text-[hsl(var(--fg))]">Sign in</div>
                  <div className="text-sm text-[hsl(var(--muted-fg))]">Welcome back.</div>
                </div>

                <div>{loginForm}</div>

                <div className="text-xs text-[hsl(var(--muted-fg))]">
                  Trouble signing in? Double-check your email and password.
                </div>
              </div>
            </div>

            {/* Right form column */}
            <div
              className={[
                'p-10 flex flex-col justify-center transition-opacity',
                isSignup ? 'pointer-events-none opacity-60' : 'pointer-events-auto opacity-100',
              ].join(' ')}
            >
              <div className="flex flex-col justify-evenly flex-1">
                <div>
                  <div className="text-2xl font-semibold text-[hsl(var(--fg))]">Create account</div>
                  <div className="text-sm text-[hsl(var(--muted-fg))]">Get started in minutes.</div>
                </div>

                <div>{signupForm}</div>

                <div className="text-xs text-[hsl(var(--muted-fg))]">
                  By creating an account, you agree to use LearnMetrics responsibly.
                </div>
              </div>
            </div>

            {/* Sliding overlay */}
            <div
              className={[
                'absolute inset-y-0 left-0 z-10 w-1/2 p-10',
                'bg-[hsl(var(--brand))] text-white',
                'transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]',
                isSignup ? 'translate-x-full' : 'translate-x-0',
              ].join(' ')}
            >
              <div className="h-full flex flex-col justify-center">
                <div className="max-w-sm">
                  <div className="text-3xl font-semibold">
                    {isSignup ? overlaySignup.title : overlayLogin.title}
                  </div>

                  <div className="mt-3 text-white/85 leading-relaxed">
                    {isSignup ? overlaySignup.body : overlayLogin.body}
                  </div>

                  <BulletList items={isSignup ? overlaySignup.bullets : overlayLogin.bullets} />

                  <div className="mt-8">
                    <Button
                      type="button"
                      variant="secondary"
                      className="bg-white text-[hsl(var(--brand))] hover:bg-white/90"
                      onClick={() => onChangeMode(isSignup ? 'login' : 'signup')}
                    >
                      {isSignup ? overlaySignup.cta : overlayLogin.cta}
                    </Button>

                    <div className="mt-4 text-xs text-white/80">
                      Switch to {isSignup ? 'sign in' : 'create account'} anytime.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
