import type { Metadata, Viewport } from 'next';
import { Fraunces, Instrument_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AppHeader } from '@/components/AppHeader';

const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'Projects · RovorAI Tickets',
  description: 'Project and ticket management',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbf6e9' },
    { media: '(prefers-color-scheme: dark)', color: '#161412' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-pop"
        >
          Skip to content
        </a>
        <Providers>
          <AppHeader />
          <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
