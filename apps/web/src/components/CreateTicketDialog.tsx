'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTicketSchema,
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  type CreateTicketInput,
} from '@app/shared';
import { toast } from 'sonner';
import { Dialog } from './Dialog';
import { useCreateTicket } from '@/lib/hooks';

export function CreateTicketDialog({
  open,
  onClose,
  projectId,
  projectName,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
}) {
  const createTicket = useCreateTicket(projectId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { title: '', description: '', status: 'TODO', priority: 'MEDIUM' },
  });

  async function onSubmit(data: CreateTicketInput) {
    try {
      await createTicket.mutateAsync(data);
      toast.success('Ticket created');
      reset();
      onClose();
    } catch {
      toast.error('Could not create ticket');
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={projectName ? `New ticket in ${projectName}` : 'New ticket'}
    >
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
            rows={3}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-2 focus:ring-ochre-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-[var(--text)]">
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
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-ochre-100 dark:hover:bg-ink-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-ochre-500 px-5 py-2 text-sm font-semibold text-white hover:bg-ochre-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating…' : 'Create ticket'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
