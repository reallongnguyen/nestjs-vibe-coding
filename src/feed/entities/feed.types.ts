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

export interface UserInfo {
  id: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface EngagementMetrics {
  contentId: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
}

export interface UserLikeStatus {
  contentId: string;
  liked: boolean;
}

export interface UserFollowStatus {
  targetUserId: string;
  following: boolean;
}
