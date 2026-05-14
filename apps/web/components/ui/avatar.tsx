import { AppImage } from './app-image';

// User avatar. Renders the uploaded image when `src` is present; falls back
// to a colored circle with the user's initials when it's not.
//
// The initials variant uses the `avatar-initials` class (globals.css) to
// override the design's `_post_img` / `_nav_profile_img` / etc. — those
// classes were sized for <img> tags and tried to apply object-fit /
// width-height rules that squashed our `<span>` into an oval.

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  size: number;
  /**
   * Full display name (e.g., "Raihan Ali"). Drives the initials shown when
   * `src` is missing, and seeds the deterministic background color.
   */
  name?: string;
  className?: string;
}

const AVATAR_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
] as const;

function hashToIndex(str: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % mod;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, alt, size, name, className }: AvatarProps) {
  if (src) {
    return (
      <AppImage
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={className}
      />
    );
  }

  const display = name?.trim() || alt || '?';
  const initials = initialsOf(display);
  const background = AVATAR_COLORS[hashToIndex(display, AVATAR_COLORS.length)];

  return (
    <span
      role="img"
      aria-label={alt || display}
      className={`avatar-initials ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        maxWidth: size,
        maxHeight: size,
        background,
        fontSize: Math.max(11, Math.floor(size * 0.38)),
      }}
    >
      {initials}
    </span>
  );
}
