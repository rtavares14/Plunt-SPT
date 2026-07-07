export type FeedFilter = 'all' | 'photos' | 'planters' | 'questions' | 'watering';

export const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All updates' },
  { key: 'photos', label: 'Plant photos' },
  { key: 'planters', label: 'Planters' },
  { key: 'questions', label: 'Questions' },
  { key: 'watering', label: 'Watering logs' },
];
