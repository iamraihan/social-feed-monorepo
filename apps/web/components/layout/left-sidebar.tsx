import { ExploreCard } from '@/features/explore';
import { SuggestedPeopleCard } from '@/features/users';
import { EventsCard } from '@/features/events';

// Stack of the three left-column cards from feed.html.

export function LeftSidebar() {
  return (
    <div className="_layout_left_sidebar_wrap">
      <ExploreCard />
      <SuggestedPeopleCard />
      <EventsCard />
    </div>
  );
}
