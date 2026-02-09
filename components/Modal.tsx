'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

type ModalProps = {
  open: boolean;
  onClose: () => void;

  title?: React.ReactNode;
  description?: React.ReactNode;

  children: React.ReactNode;

  footer?: React.ReactNode;

  size?: ModalSize;
  className?: string;

  /** close when pressing Escape */
  closeOnEsc?: boolean;
};

function sizeClasses(size: ModalSize) {
  switch (size) {
    case 'sm':
      return 'max-w-sm';
    case 'lg':
      return 'max-w-2xl';
    case 'xl':
      return 'max-w-4xl';
    case 'md':
    default:
      return 'max-w-lg';
  }
}

function getFocusable(container: HTMLElement | null) {
  if (!container) return [];
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(','))).filter(
    (el) => el.getAttribute('aria-hidden') !== 'true',
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  closeOnEsc = true,
}: ModalProps) {
  const titleId = React.useId();
  const descId = React.useId();

  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const lastActiveRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusables = getFocusable(panelRef.current);
      if (focusables.length === 0) {
        e.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || active === panelRef.current) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closeOnEsc, onClose]);

  React.useEffect(() => {
    if (!open) return;

    // save focus + lock scroll
    lastActiveRef.current = document.activeElement as HTMLElement | null;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // focus first focusable element
    const t = window.setTimeout(() => {
      const focusables = getFocusable(panelRef.current);
      if (focusables[0]) focusables[0].focus();
      else panelRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
      lastActiveRef.current?.focus?.();
      lastActiveRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  const labelledBy = title ? titleId : undefined;
  const describedBy = description ? descId : undefined;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onMouseDown={onClose}
        aria-label="Close dialog"
      />

      <div className="relative flex min-h-full items-center justify-center p-4 pointer-events-none">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          tabIndex={-1}
          className={cn(
            'pointer-events-auto',
            'w-full max-h-[85vh] overflow-hidden',
            'rounded-[28px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))]',
            'flex flex-col',
            sizeClasses(size),
            className,
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {(title || description) && (
            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <div className="min-w-0">
                {title ? (
                  <div id={titleId} className="text-base font-semibold text-[hsl(var(--fg))]">
                    {title}
                  </div>
                ) : null}
                {description ? (
                  <div id={descId} className="mt-1 text-xs text-[hsl(var(--muted-fg))]">
                    {description}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-(--radius) px-2 py-1 text-sm text-[hsl(var(--muted-fg))] hover:bg-[hsl(var(--surface-2))]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">{children}</div>

          {footer ? (
            <div className="shrink-0 border-t border-[hsl(var(--border))] px-6 py-4">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
