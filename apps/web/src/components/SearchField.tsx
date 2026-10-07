'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Search box that shows every keystroke immediately but only reports the term after typing
 * pauses, so each letter doesn't trigger a request. To discard a pending (not yet reported) term
 * from outside, remount it with a new `key`.
 */
export function SearchField({
  value,
  onChange,
  label,
  placeholder,
  className = '',
}: {
  /** The applied search term. */
  value: string;
  onChange: (next: string) => void;
  /** Accessible name; the box has no visible label. */
  label: string;
  placeholder: string;
  className?: string;
}) {
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const emitted = useRef(value);

  useEffect(() => () => clearTimeout(timer.current), []);

  // The applied term was changed from outside (e.g. a Clear button elsewhere): follow it.
  useEffect(() => {
    if (value !== emitted.current) {
      clearTimeout(timer.current);
      emitted.current = value;
      setText(value);
    }
  }, [value]);

  function emit(next: string) {
    emitted.current = next;
    onChange(next);
  }

  function handleType(next: string) {
    setText(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => emit(next), 300);
  }

  function clear() {
    clearTimeout(timer.current);
    setText('');
    emit('');
  }

  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
        aria-hidden
      />
      <input
        type="search"
        name="q"
        value={text}
        onChange={(e) => handleType(e.target.value)}
        aria-label={label}
        placeholder={placeholder}
        autoComplete="off"
        className="input px-9 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {text && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-sunken hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
