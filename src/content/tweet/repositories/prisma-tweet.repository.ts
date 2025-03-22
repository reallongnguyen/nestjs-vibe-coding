import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Tweet } from '../entities/tweet.entity';
import { TweetRepository } from './tweet.repository';

@Injectable()
export class PrismaTweetRepository implements TweetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(tweet: {
    content: string;
    images: string[];
    userId: string;
  }): Promise<Tweet> {
    const { content, images, userId } = tweet;

    const createdTweet = await this.prisma.tweet.create({
      data: {
        content,
        images,
        userId,
      },
    });

    return Tweet.create({
      id: createdTweet.id,
      content: createdTweet.content,
      images: createdTweet.images,
      userId: createdTweet.userId,
      isArchived: createdTweet.isArchived,
      version: createdTweet.version,
      createdAt: createdTweet.createdAt,
      updatedAt: createdTweet.updatedAt,
    });
  }

  async findById(id: string): Promise<Tweet | null> {
    const tweet = await this.prisma.tweet.findUnique({
      where: { id },
    });

    if (!tweet) {
      return null;
    }

    return Tweet.create({
      id: tweet.id,
      content: tweet.content,
      images: tweet.images,
      userId: tweet.userId,
      isArchived: tweet.isArchived,
      version: tweet.version,
      createdAt: tweet.createdAt,
      updatedAt: tweet.updatedAt,
    });
  }

  async findByUserId(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      includeArchived?: boolean;
    },
  ): Promise<Tweet[]> {
    const { limit = 10, offset = 0, includeArchived = false } = options || {};

    const tweets = await this.prisma.tweet.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return tweets.map((tweet) =>
      Tweet.create({
        id: tweet.id,
        content: tweet.content,
        images: tweet.images,
        userId: tweet.userId,
        isArchived: tweet.isArchived,
        version: tweet.version,
        createdAt: tweet.createdAt,
        updatedAt: tweet.updatedAt,
      }),
    );
  }

  async update(tweet: Tweet): Promise<Tweet> {
    try {
      const updatedTweet = await this.prisma.tweet.update({
        where: {
          id: tweet.id,
          version: tweet.version,
        },
        data: {
          content: tweet.content,
          images: tweet.images,
          isArchived: tweet.isArchived,
          version: tweet.version + 1,
          updatedAt: tweet.updatedAt,
        },
      });

      return Tweet.create({
        id: updatedTweet.id,
        content: updatedTweet.content,
        images: updatedTweet.images,
        userId: updatedTweet.userId,
        isArchived: updatedTweet.isArchived,
        version: updatedTweet.version,
        createdAt: updatedTweet.createdAt,
        updatedAt: updatedTweet.updatedAt,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Concurrent update detected. Please try again.');
      }
      throw error;
    }
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx || this.prisma;
    await client.tweet.delete({
      where: { id },
    });
  }

  async countByUserId(
    userId: string,
    includeArchived = false,
  ): Promise<number> {
    return this.prisma.tweet.count({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
    });
  }
}
