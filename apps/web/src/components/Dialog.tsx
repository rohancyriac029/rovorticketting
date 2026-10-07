'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Built on the native <dialog>: showModal() gives a real focus trap, Escape-to-close,
 * an inert background and focus restoration without hand-rolled key handling.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // The dialog has no padding, so a click that lands on it directly is a backdrop click.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg overscroll-contain rounded-2xl border border-line bg-surface p-0 text-ink shadow-pop"
    >
      {open && (
        <div className="relative p-5 sm:p-6">
          <h2 id={titleId} className="pr-10 font-display text-xl font-semibold tracking-tight">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          <div className="mt-5">{children}</div>
          {/* Last in DOM order so showModal() focuses the first form field, not this button. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      )}
    </dialog>
  );
}
