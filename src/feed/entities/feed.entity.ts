import { FeedContent } from './feed.types';

export interface FeedItem {
  id: string;
  type: string;
  score: number;
  content: FeedContent;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedPagedResult {
  items: FeedItem[];
  total: number;
  hasMore: boolean;
}
