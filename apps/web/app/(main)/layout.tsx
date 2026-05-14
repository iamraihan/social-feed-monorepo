import { Header } from '@/components/layout/header';
import { requireSession } from '@/features/auth/lib/session';

// Outer wrappers mirror feed.html's _layout > _main_layout > nav + container
// structure so the CSS in main.css (which assumes those ancestors) applies.
//
// Defense-in-depth auth check: the proxy already redirects unauthenticated
// requests, but per Next.js docs we should also verify auth inside each
// authenticated route. `requireSession()` is React.cache-wrapped so this
// doesn't double-read the cookie when downstream components call it again.

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireSession();
  return (
    <div className="_layout _layout_main_wrapper">
      <div className="_main_layout">
        <Header />
        {children}
      </div>
    </div>
  );
}
