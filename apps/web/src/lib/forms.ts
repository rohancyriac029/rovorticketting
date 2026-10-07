import type { KeyboardEvent } from 'react';

/** ⌘/Ctrl+Enter submits from anywhere in the form, including textareas where Enter adds a newline. */
export function submitOnModEnter(e: KeyboardEvent<HTMLFormElement>) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    e.currentTarget.requestSubmit();
  }
}
