// User-domain types. Mirrors backend UserDto / PublicUserDto shape so the
// shape doesn't have to change when API integration lands.

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarKey: string | null;
}

// People with a job/role headline. SuggestedPerson and YouMightLikePerson
// don't add anything beyond this — they're domain-aliased on purpose so
// call sites read clearly.
export interface Person extends PublicUser {
  headline: string;
}

export type SuggestedPerson = Person;
export type YouMightLikePerson = Person;

// Discriminated union — when `online` is true, no lastSeen exists. When
// false, `lastSeen` is guaranteed (no more optional ?:). TS narrows
// automatically on the `online` check inside JSX.
export type FriendPresence =
  | { online: true }
  | { online: false; lastSeen: string };

export type Friend = Person & FriendPresence;
