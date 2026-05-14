'use client';

import { type ReactNode, useId } from 'react';
import { Modal } from './modal';

// Replacement for `window.confirm()`. Asks the user to confirm a destructive
// or irreversible action with a real DOM dialog instead of a blocking native
// prompt. Two variants:
//
//   - default: blue primary confirm (for "Save", "Submit", …)
//   - danger:  red primary confirm  (for "Delete", "Discard", …)
//
// The consumer keeps the `open` state and the action handler. The dialog
// re-uses the Modal primitive for portal + focus + ESC + scroll-lock.

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Body content. Plain string or richer ReactNode. */
  description: ReactNode;
  /** Confirm button label. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  /** True while the confirm action is in flight — disables both buttons. */
  isPending?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!isPending) onCancel();
      }}
      labelledBy={titleId}
      className="confirm-dialog"
    >
      <header className="confirm-dialog-header">
        <h2 id={titleId} className="confirm-dialog-title">
          {title}
        </h2>
      </header>
      <div className="confirm-dialog-body">{description}</div>
      <footer className="confirm-dialog-footer">
        <button
          type="button"
          className="btn-reset confirm-dialog-cancel"
          onClick={onCancel}
          disabled={isPending}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={
            variant === 'danger'
              ? 'confirm-dialog-confirm confirm-dialog-confirm-danger'
              : 'confirm-dialog-confirm'
          }
          onClick={() => void onConfirm()}
          disabled={isPending}
        >
          {isPending ? 'Working…' : confirmLabel}
        </button>
      </footer>
    </Modal>
  );
}
