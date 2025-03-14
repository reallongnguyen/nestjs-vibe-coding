import { v4 as uuid } from 'uuid';
import { BaseEvent } from 'src/common/event-manager/entities/events/base.event';
import { EventSchema } from 'src/common/event-manager/entities/events/event.interface';

export interface PostUnlikedEventPayload {
  postId: string;
  userId: string;
}

/**
 * Custom schema for post unliked event
 */
const POST_UNLIKED_SCHEMA: EventSchema<PostUnlikedEventPayload> = {
  eventName: 'post.unliked',
  schema: {} as PostUnlikedEventPayload,
  version: '1.0.0',
  module: 'social',
  description: 'Emitted when a user unlikes a post',
};

/**
 * Event emitted when a user unlikes a post
 */
export class PostUnlikedEvent extends BaseEvent<PostUnlikedEventPayload> {
  /**
   * Create a new PostUnlikedEvent
   * @param postId ID of the post that was unliked
   * @param userId ID of the user who unliked the post
   */
  constructor(
    private readonly postId: string,
    private readonly userId: string,
  ) {
    super(POST_UNLIKED_SCHEMA, {
      correlationId: uuid(),
    });
  }

  /**
   * Convert to JSON representation
   * @returns JSON payload
   */
  toJSON(): PostUnlikedEventPayload {
    return {
      postId: this.postId,
      userId: this.userId,
    };
  }
}
