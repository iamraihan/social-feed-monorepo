import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Not found',
};

export default function NotFound() {
  return (
    <main className="page-centered">
      <h1 className="page-centered__heading">Page not found</h1>
      <p className="page-centered__message">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="page-centered__link">
        Go home
      </Link>
    </main>
  );
}
