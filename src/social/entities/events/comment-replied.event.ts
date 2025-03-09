import { SocialEventSchemas, EventMetadata } from 'src/common/event-manager';
import { SocialEvent } from './social.events';

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
