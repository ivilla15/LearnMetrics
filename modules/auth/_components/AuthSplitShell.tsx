'use client';

import * as React from 'react';
import { Button } from '@/components';

export type AuthMode = 'login' | 'signup';

type Copy = {
  // tab labels (mobile)
  loginTab?: string;
  signupTab?: string;

  // desktop headings/subheadings
  loginTitle?: string;
  loginSubtitle?: string;
  signupTitle?: string;
  signupSubtitle?: string;

  // desktop footers
  loginFooter?: string;
  signupFooter?: string;
};

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
  copy?: Copy;
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
  copy,
}: Props) {
  const isSignup = mode === 'signup';

  const loginTab = copy?.loginTab ?? 'Sign in';
  const signupTab = copy?.signupTab ?? 'Create account';

  const loginTitle = copy?.loginTitle ?? 'Sign in';
  const loginSubtitle = copy?.loginSubtitle ?? 'Welcome back.';

  const signupTitle = copy?.signupTitle ?? 'Create account';
  const signupSubtitle = copy?.signupSubtitle ?? 'Get started in minutes.';

  const loginFooter =
    copy?.loginFooter ?? 'Trouble signing in? Double-check your email and password.';
  const signupFooter =
    copy?.signupFooter ?? 'By creating an account, you agree to use LearnMetrics responsibly.';

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
            {loginTab}
          </Button>
          <Button
            onClick={() => onChangeMode('signup')}
            className={[
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              isSignup ? 'bg-[hsl(var(--brand))] text-white' : 'text-[hsl(var(--brand))] bg-white',
            ].join(' ')}
          >
            {signupTab}
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
        <div className="mx-auto w-full max-w-5xl rounded-4xl border-0 bg-[hsl(var(--card))] shadow-[0_30px_90px_rgba(0,0,0,0.10)] overflow-hidden">
          <div className="relative grid grid-cols-2 min-h-140">
            {/* Left form column */}
            <div
              className={[
                'p-10 flex flex-col justify-center transition-opacity',
                !isSignup ? 'pointer-events-none opacity-60' : 'pointer-events-auto opacity-100',
              ].join(' ')}
            >
              <div className="flex flex-col justify-evenly flex-1">
                <div>
                  <div className="text-2xl font-semibold text-[hsl(var(--fg))]">{loginTitle}</div>
                  <div className="text-sm text-[hsl(var(--muted-fg))]">{loginSubtitle}</div>
                </div>

                <div>{loginForm}</div>

                <div className="text-xs text-[hsl(var(--muted-fg))]">{loginFooter}</div>
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
                  <div className="text-2xl font-semibold text-[hsl(var(--fg))]">{signupTitle}</div>
                  <div className="text-sm text-[hsl(var(--muted-fg))]">{signupSubtitle}</div>
                </div>

                <div>{signupForm}</div>

                <div className="text-xs text-[hsl(var(--muted-fg))]">{signupFooter}</div>
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
                    {isSignup ? overlayLogin.title : overlaySignup.title}
                  </div>

                  <div className="mt-3 text-white/85 leading-relaxed">
                    {isSignup ? overlayLogin.body : overlaySignup.body}
                  </div>

                  <BulletList items={isSignup ? overlayLogin.bullets : overlaySignup.bullets} />

                  <div className="mt-8">
                    <Button
                      type="button"
                      variant="secondary"
                      className="bg-white text-[hsl(var(--brand))] hover:bg-white/90"
                      onClick={() => onChangeMode(isSignup ? 'login' : 'signup')}
                    >
                      {isSignup ? overlayLogin.cta : overlaySignup.cta}
                    </Button>

                    <div className="mt-4 text-xs text-white/80">
                      Switch to {isSignup ? signupTab.toLowerCase() : loginTab.toLowerCase()}{' '}
                      anytime.
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
