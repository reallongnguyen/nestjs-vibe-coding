import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PostLikedEvent } from 'src/social/entities/events/post-liked.event';
import { PostUnlikedEvent } from 'src/social/entities/events/post-unliked.event';
import { PostViewedEvent } from 'src/social/entities/events/post-viewed.event';
import { PublishedPostService } from '../../services/published-post.service';

@Injectable()
export class SocialEngagementHandler {
  private readonly logger = new Logger(SocialEngagementHandler.name);

  constructor(private readonly publishedPostService: PublishedPostService) {}

  @OnEvent(PostLikedEvent.eventName)
  async handlePostLiked(event: PostLikedEvent): Promise<void> {
    this.logger.debug(
      `Post liked: ${event.payload.postId} by ${event.payload.userId}`,
    );

    // Update post metadata or perform other actions
    await this.publishedPostService.updateEngagementMetadata(
      event.payload.postId,
      { lastEngagementAt: event.payload.timestamp },
    );
  }

  @OnEvent(PostUnlikedEvent.eventName)
  async handlePostUnliked(event: PostUnlikedEvent): Promise<void> {
    this.logger.debug(
      `Post unliked: ${event.payload.postId} by ${event.payload.userId}`,
    );

    // Update post metadata or perform other actions
    await this.publishedPostService.updateEngagementMetadata(
      event.payload.postId,
      { lastEngagementAt: event.payload.timestamp },
    );
  }

  @OnEvent(PostViewedEvent.eventName)
  async handlePostViewed(event: PostViewedEvent): Promise<void> {
    this.logger.debug(`Post viewed: ${event.payload.postId}`);

    // Update post metadata or perform other actions
    await this.publishedPostService.updateEngagementMetadata(
      event.payload.postId,
      {
        lastViewedAt: event.payload.timestamp,
        lastEngagementAt: event.payload.timestamp,
      },
    );
  }
}
