import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PostUnlikedEvent } from 'src/social/entities/events/post-unliked.event';
import { PostViewedEvent } from 'src/social/entities/events/post-viewed.event';
import {
  ContentType,
  SocialEventSchemas,
} from 'src/common/event-manager/core/domain/events/schemas/social.events';
import { LikeCreatedEvent } from 'src/common/event-manager/core/domain/events/social.events';
import { PublishedPostService } from '../../services/published-post.service';

@Injectable()
export class SocialEngagementHandler {
  private readonly logger = new Logger(SocialEngagementHandler.name);

  constructor(private readonly publishedPostService: PublishedPostService) {}

  @OnEvent(SocialEventSchemas.LIKE_CREATED.eventName)
  async handlePostLiked(event: LikeCreatedEvent): Promise<void> {
    const { contentId, contentType, actorId: userId } = event.payload;

    if (contentType !== ContentType.POST) {
      return;
    }

    this.logger.debug(`Post liked: ${contentId} by ${userId}`);

    // Update post metadata or perform other actions
    await this.publishedPostService.updateEngagementMetadata(contentId, {
      lastEngagementAt: new Date(event.metadata.timestamp),
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
