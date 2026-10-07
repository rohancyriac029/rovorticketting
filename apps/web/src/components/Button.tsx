import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost',
  danger: 'btn btn-danger',
} as const;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: 'md' | 'sm';
  /** Shows a spinner and blocks clicks while keeping the label, so the button doesn't change width. */
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${VARIANTS[variant]} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
