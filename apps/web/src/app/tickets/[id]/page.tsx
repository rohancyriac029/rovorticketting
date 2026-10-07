'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { updateTicketSchema } from '@app/shared';
import { useTicket, useUpdateTicket } from '@/lib/hooks';
import { ApiError } from '@/lib/apiFetch';
import { formatDateTime, relativeTime, useDocumentTitle } from '@/lib/format';
import { submitOnModEnter } from '@/lib/forms';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/Badges';
import { ErrorState, Skeleton } from '@/components/States';
import { TicketFields, type TicketFormValues } from '@/components/TicketFields';

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: ticket, isError, error, refetch } = useTicket(id);
  const updateTicket = useUpdateTicket(id, ticket?.projectId ?? '');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TicketFormValues>({ resolver: zodResolver(updateTicketSchema) });

  useDocumentTitle(ticket?.title);

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

  // Browser-level guard for closing the tab or reloading with unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  if (error instanceof ApiError && error.status === 404) {
    notFound();
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          title="Couldn’t load this ticket"
          message="The server didn’t respond. Check your connection and try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-2xl" aria-hidden>
        <Skeleton className="mb-4 h-5 w-64" />
        <Skeleton className="h-10 w-2/3" />
        <div className="card mt-6 space-y-5 p-5 sm:p-6">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-36 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
        </div>
      </div>
    );
  }

  const projectHref = `/projects/${ticket.projectId}`;

  async function onSubmit(data: TicketFormValues) {
    try {
      await updateTicket.mutateAsync(data);
      toast.success('Ticket saved');
      router.push(projectHref);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Couldn’t save the ticket. Try again.');
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs
        items={[
          { label: 'Projects', href: '/' },
          { label: ticket.project.name, href: projectHref },
          { label: 'Ticket' },
        ]}
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight [overflow-wrap:anywhere]">
          {ticket.title}
        </h1>
        <StatusBadge status={ticket.status} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={submitOnModEnter}
        className="card mt-6 p-5 sm:p-6"
      >
        <div className="space-y-4">
          <TicketFields register={register} errors={errors} idPrefix="ticket" descriptionRows={7} />
        </div>

        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-4 text-[13px]">
          <div className="flex gap-1.5">
            <dt className="text-muted">Created</dt>
            <dd className="tabular-nums text-ink">
              <time dateTime={ticket.createdAt}>{formatDateTime(ticket.createdAt)}</time>
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Updated</dt>
            <dd className="tabular-nums text-ink">
              <time dateTime={ticket.updatedAt} title={formatDateTime(ticket.updatedAt)}>
                {relativeTime(ticket.updatedAt)}
              </time>
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          {!isDirty && <p className="text-xs text-muted sm:mr-auto">No unsaved changes.</p>}
          <Link href={projectHref} className="btn btn-ghost">
            Cancel
          </Link>
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
