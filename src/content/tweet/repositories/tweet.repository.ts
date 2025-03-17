import { Prisma } from '@prisma/client';
import { Tweet } from '../entities/tweet.entity';

export const TWEET_REPOSITORY = 'TWEET_REPOSITORY';

export interface TweetRepository {
  create(tweet: {
    content: string;
    images: string[];
    userId: string;
  }): Promise<Tweet>;

  findById(id: string): Promise<Tweet | null>;

  findByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      includeArchived?: boolean;
    },
  ): Promise<Tweet[]>;

  update(tweet: Tweet): Promise<Tweet>;

  /**
   * Delete a tweet by ID
   * @param id - ID of the tweet to delete
   * @param tx - Optional transaction object for atomic operations
   */
  delete(id: string, tx?: Prisma.TransactionClient): Promise<void>;

  countByUserId(userId: string, includeArchived?: boolean): Promise<number>;
}
