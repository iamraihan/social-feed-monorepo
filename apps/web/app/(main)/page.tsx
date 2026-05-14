import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LeftSidebar } from '@/components/layout/left-sidebar';
import { RightSidebar } from '@/components/layout/right-sidebar';
import { requireSession } from '@/features/auth/lib/session';
import { Stories, PostComposer, FeedList } from '@/features/feed';
import { getFeed } from '@/features/feed/api/feed-api';
import { ApiClientError } from '@/lib/api-client';
import type { FeedPage } from '@/features/feed/types';

export const metadata: Metadata = {
  title: 'Home',
};

// Server Component. Fetches the first feed page server-side so the user
// sees real posts on first paint (no loading flash) and the response is
// SEO-indexable. FeedList hydrates the cache with this page, then takes
// over for infinite scroll on subsequent fetches.
//
// `requireSession()` is called both in (main)/layout.tsx and Header (cached
// by React.cache), so this read is free.
//
// The proxy refreshes access_token pre-emptively when it's missing, so we
// shouldn't normally hit 401 here. The try/catch below is a safety net for
// the rare "token revoked between proxy and render" case — send the user
// back through the auth handshake.

export default async function HomePage() {
  const currentUser = await requireSession();

  let initialPage: FeedPage | null = null;
  let feedErrorMessage: string | null = null;
  try {
    initialPage = await getFeed({ limit: 20 });
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 401) {
      redirect('/login');
    }
    // 429 from the backend throttler is transient — render the page with
    // an inline notice instead of crashing the whole (main) segment into
    // error.tsx. The user can refresh in a moment.
    if (err instanceof ApiClientError && err.status === 429) {
      feedErrorMessage =
        'Too many requests right now. Please refresh in a moment.';
    } else {
      throw err;
    }
  }

  return (
    <div className="container _custom_container">
      <div className="_layout_inner_wrap">
        <div className="row">
          <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
            <LeftSidebar />
          </div>

          <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
            <div className="_layout_middle_wrap">
              <div className="_layout_middle_inner">
                <Stories />
                <PostComposer currentUser={currentUser} />
                {initialPage ? (
                  <FeedList
                    initialPage={initialPage}
                    currentUser={currentUser}
                  />
                ) : (
                  <div role="alert" className="form-server-error">
                    {feedErrorMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
