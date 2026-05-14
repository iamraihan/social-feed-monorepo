import { YouMightLikeCard, YourFriendsCard } from '@/features/users';

// Stack of the two right-column cards from feed.html.

export function RightSidebar() {
  return (
    <div className="_layout_right_sidebar_wrap">
      <YouMightLikeCard />
      <YourFriendsCard />
    </div>
  );
}
