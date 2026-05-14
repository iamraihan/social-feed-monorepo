'use client';

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';

// Shared modal primitive. Owns the portal, backdrop, focus restore, ESC
// handler, and scroll-lock. Each consumer (LikersModal, ConfirmDialog, …)
// drops its content inside and gets consistent accessibility + behaviour
// without re-implementing the boilerplate.
//
// Closing rules:
//   - Escape key
//   - Click on the backdrop (anywhere outside the dialog body)
//   - Consumer-controlled (open=false from parent) — the consumer owns
//     close semantics for its own actions (Save, Cancel, …)
//
// Focus:
//   - On open, focus moves to the dialog itself (tabIndex=-1) so the next
//     Tab lands on the first interactive child.
//   - On close, focus is restored to whatever was focused beforehand.

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** aria-labelledby target. Defaults to a generated id if omitted. */
  labelledBy?: string;
  /** Optional className applied to the dialog body for size variants. */
  className?: string;
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  labelledBy,
  className,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const fallbackLabelId = useId();

  // Stash the latest onClose in a ref so the effect below can depend only on
  // `open`. Consumers commonly pass inline arrows (`onClose={() => …}`),
  // which would otherwise re-fire cleanup on every parent render — stealing
  // focus out of the modal mid-interaction and flapping `body.style.overflow`.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    function onKeydown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', onKeydown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeydown);
      document.body.style.overflow = previousOverflow;
      // Optimistic deletes (e.g. delete post / delete comment) unmount the
      // trigger before the dialog closes, so the captured node is no longer
      // in the DOM. `.focus()` on a detached node silently no-ops and focus
      // falls to <body> — an a11y regression. Fall back to <main> so keyboard
      // users land somewhere sensible.
      const previous = previouslyFocused.current;
      if (previous?.isConnected) {
        previous.focus();
      } else {
        document.querySelector<HTMLElement>('main')?.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  function handleBackdropClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onCloseRef.current();
  }

  // Stop key events from bubbling past the modal — prevents an Escape
  // intended for the modal from also triggering, e.g., a parent listbox.
  function stopBubblingKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  // NOTE: classes are deliberately `app-modal*`, not `.modal` / `.modal-backdrop`.
  // The design ships bootstrap.min.css globally, and Bootstrap's `.modal` class
  // sets `display: none` (Bootstrap toggles it to block via JS we don't run).
  // A naked `.modal` collision blanks the dialog while the rest of the page
  // sits behind a translucent backdrop — exactly the "black screen" symptom
  // the user saw.
  return createPortal(
    <div
      className="app-modal-backdrop"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? fallbackLabelId}
        tabIndex={-1}
        onKeyDown={stopBubblingKey}
        className={className ? `app-modal ${className}` : 'app-modal'}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
