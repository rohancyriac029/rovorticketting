import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  type TicketPriority,
  type TicketStatus,
} from '@app/shared';
import { Field, fieldAria } from './Field';

export interface TicketFormValues {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
}

/**
 * The editable ticket fields, shared by the create dialog and the edit page. The create dialog
 * hides Status: a new ticket always starts as Todo and only moves on when it is edited.
 */
export function TicketFields({
  register,
  errors,
  idPrefix,
  descriptionRows = 4,
  showStatus = true,
}: {
  register: UseFormRegister<TicketFormValues>;
  errors: FieldErrors<TicketFormValues>;
  idPrefix: string;
  descriptionRows?: number;
  showStatus?: boolean;
}) {
  return (
    <>
      <Field label="Title" htmlFor={`${idPrefix}-title`} error={errors.title?.message}>
        <input
          {...register('title')}
          {...fieldAria(`${idPrefix}-title`, errors.title?.message)}
          autoComplete="off"
          placeholder="Fix checkout timeout…"
          className="input"
        />
      </Field>
      <Field
        label="Description"
        htmlFor={`${idPrefix}-description`}
        optional
        error={errors.description?.message}
      >
        <textarea
          {...register('description')}
          {...fieldAria(`${idPrefix}-description`, errors.description?.message)}
          rows={descriptionRows}
          placeholder="Steps to reproduce, expected behaviour, context…"
          className="input resize-y"
        />
      </Field>
      <div className={showStatus ? 'grid grid-cols-2 gap-4' : undefined}>
        {showStatus && (
          <Field label="Status" htmlFor={`${idPrefix}-status`} error={errors.status?.message}>
            <select {...register('status')} id={`${idPrefix}-status`} className="input">
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TICKET_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Priority" htmlFor={`${idPrefix}-priority`} error={errors.priority?.message}>
          <select {...register('priority')} id={`${idPrefix}-priority`} className="input">
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {TICKET_PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </>
  );
}
