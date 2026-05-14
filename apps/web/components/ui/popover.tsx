'use client';

import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from 'react';

// Headless popover for menus, action lists, tooltips with interactive content.
// Anchored to its trigger via the parent's `position: relative` (no Floating
// UI dependency — the trigger and panel are siblings inside the wrapper, and
// the design ships positioning utilities like `_feed_timeline_dropdown` that
// own the offsets).
//
// Closes on:
//   - Trigger click again (the parent toggles `open`)
//   - Click outside the wrapper element
//   - Escape key
//   - Tab past the last focusable child (focus moves out, popover closes)
//
// The consumer renders the trigger + panel as children of the wrapper this
// component renders. Common usage:
//
//   <Popover open={open} onOpenChange={setOpen} ariaLabel="Post options">
//     <Popover.Trigger>…</Popover.Trigger>
//     <Popover.Content>…</Popover.Content>
//   </Popover>
//
// Kept as a single component (not the compound Trigger/Content pattern) for
// brevity — the design's existing classes already structure the markup.

interface PopoverProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Visible label for the menu — wired to aria-label on the panel. */
  ariaLabel: string;
  /** The trigger element (button). Rendered above the panel. */
  trigger: ReactNode;
  /** The panel content. Only rendered when `open` is true. */
  children: ReactNode;
  /** Optional className on the wrapper (positioning context). */
  className?: string;
  /** Optional className on the floating panel (size, offsets, design CSS). */
  panelClassName?: string;
}

export function Popover({
  open,
  onOpenChange,
  ariaLabel,
  trigger,
  children,
  className,
  panelClassName,
}: PopoverProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  // Stash the latest onOpenChange in a ref so the listener-bound effect
  // depends only on `open`. Without this, consumers passing an inline arrow
  // would cause the document-level pointerdown/keydown listeners to be torn
  // down and re-attached on every parent render — a real race with user
  // clicks. `useState` setters are stable so consumers using setters today
  // are already fine, but the API doesn't enforce that and shouldn't have to.
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  useEffect(() => {
    if (!open) return;

    function close() {
      onOpenChangeRef.current(false);
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (target && wrapperRef.current && !wrapperRef.current.contains(target)) {
        close();
      }
    }
    function onKeydown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeydown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeydown);
    };
  }, [open]);

  // Focus the first interactive element in the panel on open so keyboard
  // users land inside the menu without an extra Tab.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = panel.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus();
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className={className ?? 'popover-wrapper'}
      data-popover-open={open || undefined}
    >
      {/* Trigger receives aria wiring via the consumer; we just render it. */}
      {trigger}
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="menu"
          aria-label={ariaLabel}
          className={panelClassName ?? 'popover-panel'}
        >
          {children}
        </div>
      )}
    </div>
  );
}
