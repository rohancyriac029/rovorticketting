import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-3 px-4 py-24 text-center">
      <h1 className="text-xl font-semibold text-[var(--text)]">Page not found</h1>
      <Link href="/" className="font-medium text-ochre-600 hover:underline dark:text-ochre-300">
        Back to dashboard
      </Link>
    </main>
  );
}
