import { FeedContentType, Feed as PrismaFeed } from '@prisma/client';
import { PostContent, EmotionContent } from './feed-content.entity';

export { FeedContentType } from '@prisma/client';

export interface Feed extends PrismaFeed {
  publishedPost: PostContent | null;
  userEmotion: EmotionContent | null;
}

export interface FeedCreateInput {
  id: string;
  type: FeedContentType;
  score: number;
  publishedPostId: string | null;
  userEmotionId: string | null;
  publishedPost: PostContent | null;
  userEmotion: EmotionContent | null;
  viewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export function createFeed(input: FeedCreateInput): Feed {
  return {
    ...input,
    id: input.id,
    contentType: input.type,
    publishedPostId: input.publishedPostId,
    userEmotionId: input.userEmotionId,
    score: input.score,
    viewedAt: input.viewedAt,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    publishedPost: input.publishedPost,
    userEmotion: input.userEmotion,
  };
}
