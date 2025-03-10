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

export interface FeedCollection {
  items: FeedItem[];
  total: number;
  hasMore: boolean;
}
