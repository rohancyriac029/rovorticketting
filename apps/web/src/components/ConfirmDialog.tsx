'use client';

import { Dialog } from './Dialog';
import { Button } from './Button';

/**
 * Confirmation for destructive actions. Cancel comes first in the DOM, so it is what the dialog
 * focuses on open — pressing Enter straight away dismisses rather than deletes.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  confirmLabel,
  loading,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmLabel: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="space-y-2 text-sm leading-6 text-muted">{children}</div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
