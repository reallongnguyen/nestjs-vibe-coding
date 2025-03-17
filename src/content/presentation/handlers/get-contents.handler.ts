import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { FeedContent, FeedContentType } from 'src/feed/entities/feed.types';
import {
  ContentIdWithType,
  GetContentsCommand,
} from 'src/feed/entities/commands/get-contents.command';
import { TweetService } from '../../tweet/services/tweet.service';
import { Tweet } from '../../tweet/entities/tweet.entity';
import { PublishedPostService } from '../../post/services/published-post.service';
import { PublishedPost } from '../../post/entities/published-post.entity';

@Injectable()
@CommandHandler(GetContentsCommand)
export class GetContentsHandler implements ICommandHandler<GetContentsCommand> {
  constructor(
    private readonly postService: PublishedPostService,
    private readonly tweetService: TweetService,
    private readonly logger: Logger,
  ) {}

  async execute(command: GetContentsCommand): Promise<FeedContent[]> {
    try {
      const { contentIds } = command;

      if (!contentIds.length) {
        return [];
      }

      // Parse content IDs to determine their types
      const parsedIds = this.parseContentIds(contentIds);

      // Group content IDs by type
      const postIds = parsedIds
        .filter((item) => item.type === FeedContentType.POST)
        .map((item) => item.id);

      const emotionIds = parsedIds
        .filter((item) => item.type === FeedContentType.USER_EMOTION)
        .map((item) => item.id);

      const tweetIds = parsedIds
        .filter((item) => item.type === FeedContentType.TWEET)
        .map((item) => item.id);

      // Fetch content by type in parallel
      const [posts, emotions, tweets] = await Promise.all([
        postIds.length ? this.fetchPosts(postIds) : [],
        emotionIds.length ? this.fetchEmotions(emotionIds) : [],
        tweetIds.length ? this.fetchTweets(tweetIds) : [],
      ]);

      // Map to FeedContent format
      const contents = [
        ...this.mapPostsToFeedContent(posts),
        ...this.mapEmotionsToFeedContent(emotions),
        ...this.mapTweetsToFeedContent(tweets),
      ];

      return contents;
    } catch (error) {
      this.logger.error(
        `Error fetching content: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  private async fetchPosts(postIds: string[]): Promise<PublishedPost[]> {
    try {
      // Placeholder for actual implementation
      // In a real implementation, use ContentService to fetch posts
      this.logger.debug(`Fetching posts with IDs: ${postIds.join(', ')}`);
      const posts = await this.postService.getPostsByIds(postIds);

      return posts;
    } catch (error) {
      this.logger.error(`Error fetching posts: ${error.message}`, error.stack);
      return [];
    }
  }

  private async fetchEmotions(emotionIds: string[]): Promise<any[]> {
    try {
      // Placeholder for actual implementation
      // In a real implementation, use ContentService to fetch emotions
      this.logger.debug(`Fetching emotions with IDs: ${emotionIds.join(', ')}`);
      return [];
    } catch (error) {
      this.logger.error(
        `Error fetching emotions: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  private async fetchTweets(tweetIds: string[]): Promise<Tweet[]> {
    try {
      // Fetch tweets one by one since there's no batch method
      const tweets = await Promise.all(
        tweetIds.map((id) =>
          this.tweetService.getTweetById(id).catch(() => null),
        ),
      );

      return tweets.filter(Boolean) as Tweet[];
    } catch (error) {
      this.logger.error(`Error fetching tweets: ${error.message}`, error.stack);
      return [];
    }
  }

  private mapTweetsToFeedContent(tweets: Tweet[]): FeedContent[] {
    return tweets.map((tweet) => ({
      id: tweet.id,
      type: FeedContentType.TWEET,
      content: tweet.content,
      authorId: tweet.userId,
      images: tweet.images,
      createdAt: tweet.createdAt,
      updatedAt: tweet.updatedAt,
    }));
  }

  private mapPostsToFeedContent(posts: PublishedPost[]): FeedContent[] {
    // Implementation of mapPostsToFeedContent method
    return posts.map((post) => ({
      id: post.id,
      type: FeedContentType.POST,
      title: post.title,
      content: post.content,
      authorId: post.userId,
      createdAt: post.publishedAt,
      updatedAt: post.updatedAt,
    }));
  }

  private mapEmotionsToFeedContent(emotions: any[]): FeedContent[] {
    // Implementation of mapEmotionsToFeedContent method
    return emotions.map((emotion) => ({
      id: emotion.id,
      type: FeedContentType.USER_EMOTION,
      content: emotion.note || '',
      authorId: emotion.userId,
      emotion: emotion.emotion,
      intensity: emotion.intensity,
      createdAt: emotion.createdAt,
      updatedAt: emotion.updatedAt,
    }));
  }

  private parseContentIds(contentIds: string[]): ContentIdWithType[] {
    return contentIds.map((id) => {
      // Simple format parsing based on ID prefix or format
      if (id.startsWith('post-')) {
        return { id: id.slice(5), type: FeedContentType.POST };
      }
      if (id.startsWith('emotion-')) {
        return { id: id.slice(8), type: FeedContentType.USER_EMOTION };
      }
      if (id.startsWith('tweet-')) {
        return { id: id.slice(6), type: FeedContentType.TWEET };
      }
      // Default to treating as POST type
      return { id, type: FeedContentType.POST };
    });
  }
}
