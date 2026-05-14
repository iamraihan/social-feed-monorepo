'use client';

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import type { SessionUser } from '@/features/auth/types';
import { MAX_COMMENT_LENGTH } from '../schemas/comment-schemas';

// Shared composer used for both top-level comments and inline replies. Kept
// uncontrolled at the form level (useState mirrors the textarea content) so a
// parent can re-mount it after a successful post to clear the input cleanly.
//
// Hand-rolled instead of RHF because the form has one field, one submit, and
// auto-resize behaviour that RHF doesn't help with. Validation is duplicated
// in the Server Action so the round-trip protects against tampering.

interface CommentComposerProps {
  currentUser: SessionUser;
  onSubmit: (content: string) => Promise<void> | void;
  isPending: boolean;
  /** Backend / mutation error to surface above the textarea. */
  error?: string | null;
  /** Visible when the textarea is empty. Defaults to "Write a comment". */
  placeholder?: string;
  /** Focus the textarea when it mounts — used after clicking Reply. */
  autoFocus?: boolean;
  /** Smaller avatar + tighter padding when used in nested reply context. */
  variant?: 'comment' | 'reply';
}

export function CommentComposer({
  currentUser,
  onSubmit,
  isPending,
  error,
  placeholder = 'Write a comment',
  autoFocus = false,
  variant = 'comment',
}: CommentComposerProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  // Auto-resize so the textarea grows with content up to ~5 lines.
  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const node = event.currentTarget;
    setContent(node.value);
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, 120)}px`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isPending) return;
    await onSubmit(trimmed);
    // Parent decides whether to clear (e.g. only on success). Reset locally —
    // if the parent re-mounts on success we end up at empty anyway.
    setContent('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter to submit, Shift+Enter for newline — matches typical chat UX.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.form;
      form?.requestSubmit();
    }
  }

  const avatarSize = variant === 'reply' ? 32 : 40;
  const displayName = `${currentUser.firstName} ${currentUser.lastName}`;

  return (
    <div className="_feed_inner_comment_box comment-composer">
      <form className="_feed_inner_comment_box_form" onSubmit={handleSubmit}>
        <div className="_feed_inner_comment_box_content">
          <div className="_feed_inner_comment_box_content_image">
            <Avatar
              src={currentUser.avatarKey}
              alt={displayName}
              name={displayName}
              size={avatarSize}
              className="_comment_img"
            />
          </div>
          <div className="_feed_inner_comment_box_content_txt">
            <label htmlFor={`comment-${variant}-${currentUser.id}`} className="visually-hidden">
              {placeholder}
            </label>
            <textarea
              id={`comment-${variant}-${currentUser.id}`}
              ref={textareaRef}
              className="form-control _comment_textarea"
              placeholder={placeholder}
              value={content}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              maxLength={MAX_COMMENT_LENGTH}
              disabled={isPending}
              rows={1}
            />
          </div>
        </div>
        <div className="_feed_inner_comment_box_icon comment-composer-actions">
          <button
            type="submit"
            className="btn-primary comment-composer-submit"
            disabled={!content.trim() || isPending}
          >
            {isPending ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>
      {error && (
        <p role="alert" className="form-server-error comment-composer-error">
          {error}
        </p>
      )}
    </div>
  );
}
