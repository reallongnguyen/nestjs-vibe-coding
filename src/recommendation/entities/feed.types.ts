import { ContentType } from 'src/common/event-manager/entities/events/schemas/social.events';

export enum FeedType {
  PERSONALIZED = 'personalized',
  FOLLOWING = 'following',
}

export interface FeedContent {
  id: string;
  type: ContentType;
  title?: string;
  content: string;
  authorId: string;
  score?: number;
  createdAt: Date;
  updatedAt: Date;
}
