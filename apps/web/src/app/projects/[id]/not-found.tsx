import Link from 'next/link';

export default function ProjectNotFound() {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-3 px-4 py-24 text-center">
      <h1 className="text-xl font-semibold text-[var(--text)]">Project not found</h1>
      <p className="text-sm text-[var(--text-muted)]">
        This project may have been removed, or the link is incorrect.
      </p>
      <Link href="/" className="font-medium text-ochre-600 hover:underline dark:text-ochre-300">
        Back to dashboard
      </Link>
    </main>
  );
}
