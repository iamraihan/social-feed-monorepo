import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AuthShapeBackgrounds } from './_components/auth-shape-backgrounds';

// Shared layout for /login and /register. The shape decorations live here
// once; each page just renders its col-8 illustration + col-4 form.

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthShapeBackgrounds />
      {children}
    </>
  );
}
