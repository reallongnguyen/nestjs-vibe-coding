/**
 * Re-export PostLikedEvent from common module
 * This file exists for backward compatibility
 */
import { PostLikedEvent as CommonPostLikedEvent } from 'src/common/event-bus/core/domain/events/social-interaction.events';

export interface PostLikedEventPayload {
  postId: string;
  userId: string;
}

/**
 * @deprecated Use the common implementation from src/common/event-bus/core/domain/events/social-interaction.events
 */
export class PostLikedEvent extends CommonPostLikedEvent {
  static readonly eventName = CommonPostLikedEvent.EVENT_NAME;

  constructor(
    readonly postId: string,
    readonly userId: string,
    params: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ) {
    // Map to common implementation
    super(
      postId,
      userId, // Using userId as postOwnerId for compatibility
      userId, // Using userId as likerId for compatibility
      'Isling', // Default likerName
      undefined, // No likerAvatar
      'Mot con vit xoe ra 2 cai canh', // No postTitle
      Date.now(),
      params,
    );
  }

  // Override toJSON to maintain backward compatibility
  toJSON(): PostLikedEventPayload {
    return {
      postId: this.postId,
      userId: this.userId,
    };
  }
}
