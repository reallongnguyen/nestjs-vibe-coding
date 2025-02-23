import { Feed as PrismaFeed, FeedContentType } from '@prisma/client';

export { FeedContentType };

export interface PostContent {
  id: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  cover?: string;
  readingTime: number;
  likeCount: number;
  replyCount: number;
  viewCount: number;
  publishedAt: Date;
  userAuthor?: {
    id: string;
    firstName: string;
    lastName?: string;
    avatar?: string;
  };
  botAuthor?: {
    id: string;
    name: string;
  };
}

export interface EmotionContent {
  id: string;
  emotion: string;
  intensity: number;
  note?: string;
  date: Date;
  user: {
    id: string;
    firstName: string;
    lastName?: string;
    avatar?: string;
  };
}

export interface Feed extends PrismaFeed {
  id: string;
  contentType: FeedContentType;
  publishedPostId: string | null;
  userEmotionId: string | null;
  userId: string;
  score: number;
  viewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  publishedPost: PostContent | null;
  userEmotion: EmotionContent | null;
}
