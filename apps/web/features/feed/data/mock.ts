import type { Story } from '../types';

// Stories are visual scaffolding from the original HTML design — not a
// real backend feature (no /stories endpoint exists). Kept as mock until
// stories ship as a backend feature in their own branch. Everything else
// in this file was deleted with the feed-API integration.

export const mockStories: Story[] = [
  {
    id: 's1',
    name: 'Ryan Roslansky',
    imageKey: '/assets/images/card_ppl2.png',
    miniImageKey: '/assets/images/mini_pic.png',
  },
  {
    id: 's2',
    name: 'Ryan Roslansky',
    imageKey: '/assets/images/card_ppl3.png',
    miniImageKey: '/assets/images/mini_pic.png',
  },
  {
    id: 's3',
    name: 'Ryan Roslansky',
    imageKey: '/assets/images/card_ppl4.png',
    miniImageKey: '/assets/images/mini_pic.png',
  },
];
