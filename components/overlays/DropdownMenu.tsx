'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

type Item = {
  label: string;
  tone?: 'default' | 'danger';
  onSelect: () => void;
};

export function DropdownMenu({ buttonLabel, items }: { buttonLabel: string; items: Item[] }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const itemCount = items.length;
  const itemIds = useMemo(() => items.map((_, idx) => `${menuId}-item-${idx}`), [items, menuId]);

  useEffect(() => {
    if (!open) return;

    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node | null;
      if (!t) return;
      if (menuRef.current?.contains(t)) return;
      if (buttonRef.current?.contains(t)) return;
      setOpen(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }

      if (!menuRef.current) return;

      const active = document.activeElement as HTMLElement | null;
      const currentIndex = itemIds.findIndex((id) => id === active?.id);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = currentIndex >= 0 ? (currentIndex + 1) % itemCount : 0;
        document.getElementById(itemIds[next])?.focus();
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = currentIndex >= 0 ? (currentIndex - 1 + itemCount) % itemCount : itemCount - 1;
        document.getElementById(itemIds[prev])?.focus();
      }

      if (e.key === 'Home') {
        e.preventDefault();
        document.getElementById(itemIds[0])?.focus();
      }

      if (e.key === 'End') {
        e.preventDefault();
        document.getElementById(itemIds[itemCount - 1])?.focus();
      }
    }

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, itemCount, itemIds]);

  useEffect(() => {
    if (!open) return;
    // focus first item on open
    const t = window.setTimeout(() => {
      document.getElementById(itemIds[0])?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, itemIds]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]"
        aria-label={buttonLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title="More"
      >
        <span className="text-sm leading-none">⋯</span>
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Actions"
          className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))]"
        >
          {items.map((it, idx) => (
            <button
              key={it.label}
              id={itemIds[idx]}
              type="button"
              role="menuitem"
              tabIndex={0}
              onClick={() => {
                it.onSelect();
                setOpen(false);
                buttonRef.current?.focus();
              }}
              className={[
                'block w-full px-5 py-3 text-left text-sm hover:bg-[hsl(var(--surface-2))]',
                it.tone === 'danger' ? 'text-[hsl(var(--danger))]' : 'text-[hsl(var(--fg))]',
              ].join(' ')}
            >
              {it.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
