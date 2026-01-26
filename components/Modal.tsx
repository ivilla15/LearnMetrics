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
    case 'md':
    default:
      return 'max-w-lg';
  }
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
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (!closeOnEsc) return;
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closeOnEsc, onClose]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay (always clickable) */}
      <div
        className="absolute inset-0 bg-black/40"
        onMouseDown={onClose}
        role="presentation"
        aria-hidden="true"
      />

      {/* Wrapper ignores clicks; dialog re-enables them */}
      <div className="relative flex min-h-full items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
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
                  <div className="text-base font-semibold text-[hsl(var(--fg))]">{title}</div>
                ) : null}
                {description ? (
                  <div className="mt-1 text-xs text-[hsl(var(--muted-fg))]">{description}</div>
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

          {/* Body (scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">{children}</div>

          {/* Footer */}
          {footer ? (
            <div className="shrink-0 border-t border-[hsl(var(--border))] px-6 py-4">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
