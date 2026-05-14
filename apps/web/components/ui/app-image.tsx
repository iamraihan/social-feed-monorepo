import NextImage, { type ImageProps } from 'next/image';

// App-wide image component (use this everywhere instead of next/image).
//
// Policy:
//   - Local `/public` assets pass through `unoptimized` — they're already
//     optimized (the design ships pre-built PNG/SVG) and re-processing
//     would just spend CPU for no benefit.
//   - Remote URLs (backend uploads at http(s)://…) go through Next.js's
//     optimizer at `/_next/image`. That means:
//       1. The browser fetches the image from our own origin, sidestepping
//          backend CORP / CORS issues for image embeds.
//       2. We get free WebP/AVIF transcoding + responsive `srcset`.
//       3. Cached at the edge (Vercel) or in `.next/cache/images`.
//   - Callers can override per-call: pass `unoptimized={true}` to force
//     pass-through even for remote URLs, or `unoptimized={false}` to opt
//     a local asset into the optimizer.
//
// The optimizer only accepts hosts listed in `next.config.ts`'s
// `images.remotePatterns` — that allow-list is the security boundary.

export type AppImageProps = ImageProps;

function isRemoteUrl(src: unknown): boolean {
  return typeof src === 'string' && /^https?:\/\//i.test(src);
}

export function AppImage(props: AppImageProps) {
  const unoptimized = props.unoptimized ?? !isRemoteUrl(props.src);
  return <NextImage {...props} unoptimized={unoptimized} />;
}
