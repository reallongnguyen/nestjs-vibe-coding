import { FeedContent } from './feed.types';

export interface FeedItem {
  id: string;
  type: string;
  score: number;
  content: FeedContent;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedPagedResult {
  items: FeedItem[];
  total: number;
  hasMore: boolean;
}
