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
    this.logger.debug(`Post liked: ${event.postId} by ${event.userId}`);

    // Update post metadata or perform other actions
    await this.publishedPostService.updateEngagementMetadata(event.postId, {
      lastEngagementAt: event.occurredOn,
    });
  }

  @OnEvent(PostUnlikedEvent.eventName)
  async handlePostUnliked(event: PostUnlikedEvent): Promise<void> {
    this.logger.debug(`Post unliked: ${event.postId} by ${event.userId}`);

    // Update post metadata or perform other actions
    await this.publishedPostService.updateEngagementMetadata(event.postId, {
      lastEngagementAt: event.occurredOn,
    });
  }

  @OnEvent(PostViewedEvent.eventName)
  async handlePostViewed(event: PostViewedEvent): Promise<void> {
    this.logger.debug(`Post viewed: ${event.postId}`);

    // Update post metadata or perform other actions
    await this.publishedPostService.updateEngagementMetadata(event.postId, {
      lastViewedAt: event.occurredOn,
      lastEngagementAt: event.occurredOn,
    });
  }
}
