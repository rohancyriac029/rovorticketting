import Link from 'next/link';
import { Ticket } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
        <Link href="/" className="-ml-1 flex items-center gap-2.5 rounded-lg px-1 py-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-ink">
            <Ticket className="h-4 w-4 -rotate-12" aria-hidden />
          </span>
          <span translate="no" className="font-display text-[17px] font-semibold tracking-tight">
            RovorAI Tickets
          </span>
        </Link>
      </div>
    </header>
  );
}
