import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-text">
        <Compass className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        This project or ticket doesn’t exist, or the link is incorrect.
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        Back to Projects
      </Link>
    </div>
  );
}
