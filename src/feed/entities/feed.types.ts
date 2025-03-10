export enum FeedType {
  PERSONALIZED = 'personalized',
  FOLLOWING = 'following',
  TRENDING = 'trending',
  LATEST = 'latest',
}

export interface FeedContent {
  id: string;
  type: string;
  title?: string;
  content: string;
  authorId: string;
  score?: number;
  emotion?: string;
  intensity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedEnrichmentData {
  contentIds: string[];
  feedType: FeedType;
  userId: string;
}
