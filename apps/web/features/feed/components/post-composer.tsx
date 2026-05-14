'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { Avatar } from '@/components/ui/avatar';
import type { SessionUser } from '@/features/auth/types';
import { useCreatePost } from '../hooks/use-create-post';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_MB,
  type PostVisibilityInput,
} from '../schemas/post-schemas';
import type { CreatePostActionResult } from '../actions/create-post-action';

// Composer with text + optional image + visibility toggle. Submits via
// useCreatePost (TanStack Query mutation around the Server Action), so the
// feed list automatically refetches on success and the textarea/image
// reset. We do client-side image validation for UX; the action re-validates
// before sending to the backend.

interface PostComposerProps {
  currentUser: SessionUser;
}

export function PostComposer({ currentUser }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibilityInput>('PUBLIC');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { mutateAsync, isPending } = useCreatePost();

  // Clean up the object URL when the preview changes or the component
  // unmounts — otherwise we leak memory in a long-lived session.
  useEffect(() => {
    if (!imagePreview) return;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setImageError(null);
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(`Image must be ${MAX_IMAGE_MB} MB or smaller`);
      return;
    }
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setImageError('Image must be JPEG, PNG, WebP, or GIF');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function resetForm() {
    setContent('');
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setImageError(null);

    if (!content.trim()) {
      setFormError('Write something before posting');
      return;
    }

    const formData = new FormData();
    formData.set('content', content.trim());
    formData.set('visibility', visibility);
    if (imageFile) formData.set('image', imageFile);

    try {
      await mutateAsync(formData);
      resetForm();
    } catch (err) {
      // Action returned ok:false — surface field/form errors. The hook
      // stashed the structured result on the error.
      const result = (err as Error & { result?: CreatePostActionResult }).result;
      if (result && !result.ok) {
        if (result.fieldErrors?.content?.[0]) {
          setFormError(result.fieldErrors.content[0]);
        } else if (result.fieldErrors?.image?.[0]) {
          setImageError(result.fieldErrors.image[0]);
        } else {
          setFormError(result.formError ?? (err as Error).message);
        }
      } else {
        setFormError((err as Error).message);
      }
    }
  }

  const canSubmit = content.trim().length > 0 && !isPending && !imageError;

  return (
    <div className="_feed_inner_text_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
      <form onSubmit={handleSubmit} noValidate>
        {formError && (
          <div role="alert" className="form-server-error">
            {formError}
          </div>
        )}

        <div className="_feed_inner_text_area_box">
          <div className="_feed_inner_text_area_box_image">
            <Avatar
              src={currentUser.avatarKey}
              alt={`${currentUser.firstName} ${currentUser.lastName}`}
              name={`${currentUser.firstName} ${currentUser.lastName}`}
              size={48}
              className="_txt_img"
            />
          </div>
          <div className="form-floating _feed_inner_text_area_box_form">
            <textarea
              className="form-control _textarea"
              placeholder="Write something …"
              id="postContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              aria-label="Post content"
            />
          </div>
        </div>

        {imagePreview && (
          <div className="composer-image-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Selected image preview" />
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="composer-image-remove btn-reset"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        )}
        {imageError && (
          <p role="alert" className="form-field-error">
            {imageError}
          </p>
        )}

        <div className="_feed_inner_text_area_bottom">
          <div className="_feed_inner_text_area_item">
            <div className="_feed_inner_text_area_bottom_photo _feed_common">
              <button
                type="button"
                className="_feed_inner_text_area_bottom_photo_link btn-reset"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                  📷
                </span>
                Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                onChange={handleFileChange}
                className="visually-hidden"
                aria-label="Attach image"
              />
            </div>

            <div className="composer-visibility">
              <label htmlFor="postVisibility" className="visually-hidden">
                Post visibility
              </label>
              <select
                id="postVisibility"
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as PostVisibilityInput)
                }
                className="composer-visibility-select"
              >
                <option value="PUBLIC">🌐 Public</option>
                <option value="PRIVATE">🔒 Private (only you)</option>
              </select>
            </div>
          </div>

          <div className="_feed_inner_text_area_btn">
            <button
              type="submit"
              className="_feed_inner_text_area_btn_link"
              disabled={!canSubmit}
            >
              <svg
                className="_mar_img"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="13"
                fill="none"
                viewBox="0 0 14 13"
              >
                <path
                  fill="#fff"
                  fillRule="evenodd"
                  d="M6.37 7.879l2.438 3.955a.335.335 0 00.34.162c.068-.01.23-.05.289-.247l3.049-10.297a.348.348 0 00-.09-.35.341.341 0 00-.34-.088L1.75 4.03a.34.34 0 00-.247.289.343.343 0 00.16.347L5.666 7.17 9.2 3.597a.5.5 0 01.712.703L6.37 7.88zM9.097 13c-.464 0-.89-.236-1.14-.641L5.372 8.165l-4.237-2.65a1.336 1.336 0 01-.622-1.331c.074-.536.441-.96.957-1.112L11.774.054a1.347 1.347 0 011.67 1.682l-3.05 10.296A1.332 1.332 0 019.098 13z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{isPending ? 'Posting…' : 'Post'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
