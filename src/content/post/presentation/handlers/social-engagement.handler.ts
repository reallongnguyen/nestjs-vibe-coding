import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PostUnlikedEvent } from 'src/social/entities/events/post-unliked.event';
import { PostViewedEvent } from 'src/social/entities/events/post-viewed.event';
import {
  ContentType,
  SocialEventSchemas,
  EventBusMessage,
} from 'src/common/event-manager';
import { PublishedPostService } from '../../services/published-post.service';

@Injectable()
export class SocialEngagementHandler {
  private readonly logger = new Logger(SocialEngagementHandler.name);

  constructor(private readonly publishedPostService: PublishedPostService) {}

  @OnEvent(SocialEventSchemas.LIKE_CREATED.eventName)
  async handlePostLiked(
    event: EventBusMessage<typeof SocialEventSchemas.LIKE_CREATED.schema>,
  ): Promise<void> {
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

  @OnEvent('post.unliked')
  async handlePostUnliked(event: PostUnlikedEvent): Promise<void> {
    const payload = event.toJSON();
    this.logger.debug(`Post unliked: ${payload.postId} by ${payload.userId}`);

    // Update post metadata or perform other actions
    await this.publishedPostService.updateEngagementMetadata(payload.postId, {
      lastEngagementAt: new Date(),
    });
  }

  @OnEvent('post.viewed')
  async handlePostViewed(event: PostViewedEvent): Promise<void> {
    const payload = event.toJSON();
    this.logger.debug(`Post viewed: ${payload.postId}`);

    // Update post metadata or perform other actions
    await this.publishedPostService.updateEngagementMetadata(payload.postId, {
      lastViewedAt: new Date(),
      lastEngagementAt: new Date(),
    });
  }
}
