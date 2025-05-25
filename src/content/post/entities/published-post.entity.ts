import { PublishedPost as PublishedPostPrisma } from 'src/generated/client';

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
  userId: string;
  publishedAt: Date;
  updatedAt: Date;
  isArchived: boolean;
  botId: string | null;
  authorType: string;
  metadata: PrismaJson.PostMetadataType;
}

export class UserAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

export class PublishedPostWithAuthor extends PublishedPost {
  userAuthor: UserAuthor;
  topics: string[];
}
