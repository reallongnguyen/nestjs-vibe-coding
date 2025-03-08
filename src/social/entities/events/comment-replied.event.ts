import { SocialEvent } from 'src/common/event-manager/core/domain/events/social.events';
import { SocialEventSchemas } from 'src/common/event-manager/core/domain/events/schemas/social.events';
import { EventMetadata } from 'src/common/event-manager/core/domain/events/event.interface';

/**
 * Event emitted when a user replies to a comment
 */
export class CommentRepliedEvent extends SocialEvent<
  typeof SocialEventSchemas.COMMENT_REPLIED.schema
> {
  constructor(
    payload: typeof SocialEventSchemas.COMMENT_REPLIED.schema,
    metadata?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(SocialEventSchemas.COMMENT_REPLIED, payload, metadata);
  }
}
