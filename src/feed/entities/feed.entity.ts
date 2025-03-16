import { FeedContent } from './feed.types';

export interface FeedItem {
  id: string;
  type: string;
  score: number;
  content: FeedContent;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  engagement?: {
    likeCount: number;
    commentCount: number;
    viewCount: number;
  };
  userSpecific?: {
    liked: boolean;
    following: boolean;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedPagedResult {
  items: FeedItem[];
  total: number;
  hasMore: boolean;
}
