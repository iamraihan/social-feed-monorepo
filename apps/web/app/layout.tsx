import type { Metadata } from 'next';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

// Root metadata. Per-route pages override `title` via their own Metadata
// export — `template` lets them set a short title and inherit the brand
// suffix automatically.

export const metadata: Metadata = {
  title: {
    default: 'Buddy Script',
    template: '%s · Buddy Script',
  },
  description: 'A social feed for staying connected with the people you follow.',
  applicationName: 'Buddy Script',
  referrer: 'strict-origin-when-cross-origin',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/*
          The design ships its own CSS bundle (bootstrap + custom). Lives in
          /public/assets/css so the existing class-name system keeps
          working. Next.js would prefer these be imported via the module
          graph (then they're code-split / critical-chunked) — that's a
          follow-up refactor: copy the four files into /styles and `import`
          them here instead of <link>-tagging.
        */}
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/common.css" />
        <link rel="stylesheet" href="/assets/css/main.css" />
        <link rel="stylesheet" href="/assets/css/responsive.css" />
      </head>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
