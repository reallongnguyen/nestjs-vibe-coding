export class PublishedPost {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  content: Record<string, any>;
  excerpt: string;
  cover: string | null;
  readingTime: number;
  topics: string[];
  likeCount: number;
  replyCount: number;
  viewCount: number;
  userId: string;
  publishedAt: Date;
  updatedAt: Date;
}
