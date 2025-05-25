import { DraftPost as DraftPostPrisma } from 'src/generated/client';

export class DraftPost implements DraftPostPrisma {
  id: string;
  title: string;
  subtitle: string | null;
  content: Record<string, any>;
  cover: string | null;
  topics: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  publishedId: string | null;
}
