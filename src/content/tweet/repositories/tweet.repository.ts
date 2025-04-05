import { Tweet } from '../models/tweet.model';

export const TWEET_REPOSITORY = 'TWEET_REPOSITORY';

export interface FindTweetsOptions {
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}

export interface TweetRepository {
  create(data: {
    content: string;
    images: string[];
    userId: string;
  }): Promise<Tweet>;
  findById(id: string): Promise<Tweet | null>;
  findByUserId(userId: string, options?: FindTweetsOptions): Promise<Tweet[]>;
  update(tweet: Tweet): Promise<Tweet>;
  delete(id: string): Promise<void>;
  countByUserId(userId: string, includeArchived?: boolean): Promise<number>;
}
