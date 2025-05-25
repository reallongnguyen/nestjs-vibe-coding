import { Topic as TopicPrisma } from 'src/generated/client';

export class Topic implements TopicPrisma {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
