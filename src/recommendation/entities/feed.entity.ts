import { FeedContent } from './feed.types';

export interface FeedItem {
  id: string;
  type: string;
  score: number;
  content: FeedContent;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedCollection {
  items: FeedItem[];
  total: number;
  hasMore: boolean;
}
