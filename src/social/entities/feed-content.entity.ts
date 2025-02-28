import { FeedContentType } from './feed.entity';

export interface Author {
  id: string;
  firstName: string;
  lastName?: string;
  avatar?: string;
}

export interface BotAuthor {
  id: string;
  name: string;
}

export interface PostContent {
  id: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  cover?: string;
  readingTime: number;
  publishedAt: Date;
  userAuthor?: Author;
  botAuthor?: BotAuthor;
}

export interface EmotionContent {
  id: string;
  emotion: string;
  intensity: number;
  note?: string;
  date: Date;
  user: Author;
}

export interface FeedItem {
  id: string;
  type: FeedContentType;
  score: number;
  timestamp: Date;
}
