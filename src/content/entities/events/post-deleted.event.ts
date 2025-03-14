import { BaseEvent, ContentEventSchemas } from 'src/common/event-manager';
import { v4 as uuid } from 'uuid';

/**
 * Event payload for post deleted events
 */
export interface PostDeletedPayload {
  /**
   * ID of the post that was deleted
   */
  postId: string;

  /**
   * ID of the user who deleted the post
   */
  userId: string;
}

/**
 * Event emitted when a draft post is deleted
 */
export class DraftPostDeletedEvent extends BaseEvent<PostDeletedPayload> {
  /**
   * Internal payload storage
   */
  private readonly payloadData: PostDeletedPayload;

  /**
   * Create a new draft post deleted event
   * @param payload Event payload
   */
  constructor(payload: PostDeletedPayload) {
    super(ContentEventSchemas.DRAFT_POST_DELETED, {
      correlationId: uuid(),
    });
    this.payloadData = payload;
  }

  /**
   * Convert to JSON
   * @returns JSON representation
   */
  toJSON(): PostDeletedPayload {
    return this.payloadData;
  }
}

/**
 * Event emitted when a published post is deleted
 */
export class PublishedPostDeletedEvent extends BaseEvent<PostDeletedPayload> {
  /**
   * Internal payload storage
   */
  private readonly payloadData: PostDeletedPayload;

  /**
   * Create a new published post deleted event
   * @param payload Event payload
   */
  constructor(payload: PostDeletedPayload) {
    super(ContentEventSchemas.PUBLISHED_POST_DELETED, {
      correlationId: uuid(),
    });
    this.payloadData = payload;
  }

  /**
   * Convert to JSON
   * @returns JSON representation
   */
  toJSON(): PostDeletedPayload {
    return this.payloadData;
  }
}
