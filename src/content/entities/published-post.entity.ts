import { PublishedPost as PublishedPostPrisma } from '@prisma/client';

export class PublishedPost implements PublishedPostPrisma {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  content: Record<string, any>;
  excerpt: string;
  cover: string | null;
  readingTime: number;
  topics?: string[];
  likeCount: number;
  replyCount: number;
  viewCount: number;
  userId: string;
  publishedAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  botId: string | null;
  authorType: string;
}

export class UserAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

export class PublishedPostWithAuthor extends PublishedPost {
  userAuthor: UserAuthor;
}
