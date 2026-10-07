'use client';

import { useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  updateTicketSchema,
  type UpdateTicketInput,
} from '@app/shared';
import { useTicket, useUpdateTicket } from '@/lib/hooks';
import { ApiError } from '@/lib/apiFetch';
import { ErrorState } from '@/components/States';
import { relativeTime } from '@/lib/format';

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: ticket, isLoading, isError, error, refetch } = useTicket(id);
  const updateTicket = useUpdateTicket(id, ticket?.projectId ?? '');

  if (error instanceof ApiError && error.status === 404) {
    notFound();
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateTicketInput>({
    resolver: zodResolver(updateTicketSchema),
  });

  useEffect(() => {
    if (ticket) {
      reset({
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
      });
    }
  }, [ticket, reset]);

  async function onSubmit(data: UpdateTicketInput) {
    try {
      await updateTicket.mutateAsync(data);
      toast.success('Ticket saved');
      router.push(`/projects/${ticket!.projectId}`);
    } catch {
      toast.error('Could not save ticket');
    }
  }

  if (isError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <ErrorState message="Could not load this ticket." onRetry={() => refetch()} />
      </main>
    );
  }

  if (isLoading || !ticket) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="h-64 animate-pulse rounded-2xl bg-ochre-100 dark:bg-ink-700" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href={`/projects/${ticket.projectId}`}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-ochre-600 hover:underline dark:text-ochre-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {ticket.project.name}
      </Link>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-[var(--text)]">
              Title
            </label>
            <input
              id="title"
              {...register('title')}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-ochre-400"
            />
            {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>}
          </div>
          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-[var(--text)]"
            >
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={5}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-ochre-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="status"
                className="mb-1 block text-sm font-medium text-[var(--text)]"
              >
                Status
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-ochre-400"
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TICKET_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="priority"
                className="mb-1 block text-sm font-medium text-[var(--text)]"
              >
                Priority
              </label>
              <select
                id="priority"
                {...register('priority')}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-ochre-400"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {TICKET_PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-[var(--text-muted)]">
            <span>Created {relativeTime(ticket.createdAt)}</span>
            <span>Updated {relativeTime(ticket.updatedAt)}</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push(`/projects/${ticket.projectId}`)}
              className="rounded-full px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-ochre-100 dark:hover:bg-ink-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="rounded-full bg-ochre-500 px-5 py-2 text-sm font-semibold text-white hover:bg-ochre-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
