'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTicketSchema } from '@app/shared';
import { toast } from 'sonner';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { TicketFields, type TicketFormValues } from './TicketFields';
import { useCreateTicket } from '@/lib/hooks';
import { ApiError } from '@/lib/apiFetch';
import { submitOnModEnter } from '@/lib/forms';

// No status here: the form doesn't offer one, so the API's default (Todo) applies.
const DEFAULTS: TicketFormValues = {
  title: '',
  description: '',
  priority: 'MEDIUM',
};

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
  } = useForm<TicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: DEFAULTS,
  });

  function close() {
    reset(DEFAULTS);
    onClose();
  }

  async function onSubmit(data: TicketFormValues) {
    try {
      await createTicket.mutateAsync(createTicketSchema.parse(data));
      toast.success('Ticket created');
      close();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Couldn’t create the ticket. Try again.');
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="New Ticket"
      description={`${projectName ? `In ${projectName}. ` : ''}Starts as Todo.`}
    >
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={submitOnModEnter} className="space-y-4">
        <TicketFields
          register={register}
          errors={errors}
          idPrefix={`new-ticket-${projectId}`}
          showStatus={false}
        />
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create Ticket
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
