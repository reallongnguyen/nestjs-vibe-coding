import { v4 as uuid } from 'uuid';
import { BaseEvent } from 'src/common/event-manager/entities/events/base.event';
import { EventSchema } from 'src/common/event-manager/entities/events/event.interface';

export interface PostViewedEventPayload {
  postId: string;
  viewerHash: string;
  viewerId?: string;
}

/**
 * Custom schema for post viewed event
 */
const POST_VIEWED_SCHEMA: EventSchema<PostViewedEventPayload> = {
  eventName: 'post.viewed',
  schema: {} as PostViewedEventPayload,
  version: '1.0.0',
  module: 'social',
  description: 'Emitted when a post is viewed',
};

/**
 * Event emitted when a post is viewed
 */
export class PostViewedEvent extends BaseEvent<PostViewedEventPayload> {
  /**
   * Create a new PostViewedEvent
   * @param postId ID of the post that was viewed
   * @param viewerHash Hash identifying the viewer
   * @param viewerId Optional ID of the logged-in viewer
   */
  constructor(
    private readonly postId: string,
    private readonly viewerHash: string,
    private readonly viewerId?: string,
  ) {
    super(POST_VIEWED_SCHEMA, {
      correlationId: uuid(),
    });
  }

  /**
   * Convert to JSON representation
   * @returns JSON payload
   */
  toJSON(): PostViewedEventPayload {
    return {
      postId: this.postId,
      viewerHash: this.viewerHash,
      viewerId: this.viewerId,
    };
  }
}
