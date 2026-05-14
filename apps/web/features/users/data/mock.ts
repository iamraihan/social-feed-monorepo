import type {
  Friend,
  PublicUser,
  SuggestedPerson,
  YouMightLikePerson,
} from '../types';

// TODO(feed-integration): components currently importing this should switch
// to getSession() / a passed-down `user` prop. Header already does the right
// thing via @/features/auth. Remaining callers:
//   features/feed/components/{post-composer,comment-box,stories}.tsx
export const mockCurrentUser: PublicUser = {
  id: 'me-uuid',
  firstName: 'Dylan',
  lastName: 'Field',
  avatarKey: null,
};

export const mockSuggestedPeople: SuggestedPerson[] = [
  {
    id: 'u2',
    firstName: 'Steve',
    lastName: 'Jobs',
    avatarKey: null,
    headline: 'CEO of Apple',
  },
  {
    id: 'u3',
    firstName: 'Ryan',
    lastName: 'Roslansky',
    avatarKey: null,
    headline: 'CEO of Linkedin',
  },
  {
    id: 'u4',
    firstName: 'Dylan',
    lastName: 'Field',
    avatarKey: null,
    headline: 'CEO of Figma',
  },
];

export const mockFriends: Friend[] = [
  {
    id: 'f1',
    firstName: 'Steve',
    lastName: 'Jobs',
    headline: 'CEO of Apple',
    avatarKey: null,
    online: false,
    lastSeen: '5 minute ago',
  },
  {
    id: 'f2',
    firstName: 'Ryan',
    lastName: 'Roslansky',
    headline: 'CEO of Linkedin',
    avatarKey: null,
    online: true,
  },
  {
    id: 'f3',
    firstName: 'Dylan',
    lastName: 'Field',
    headline: 'CEO of Figma',
    avatarKey: null,
    online: true,
  },
  {
    id: 'f4',
    firstName: 'Steve',
    lastName: 'Jobs',
    headline: 'CEO of Apple',
    avatarKey: null,
    online: false,
    lastSeen: '5 minute ago',
  },
];

export const mockYouMightLike: YouMightLikePerson[] = [
  {
    id: 'y1',
    firstName: 'Radovan',
    lastName: 'SkillArena',
    headline: 'Founder & CEO at Trophy',
    avatarKey: null,
  },
];
