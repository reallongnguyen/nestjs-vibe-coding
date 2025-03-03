/**
 * Re-export social interaction events from common module
 * This file exists for backward compatibility
 */
export {
  PostLikedEvent,
  CommentAddedEvent,
  UserMentionedEvent,
  UserFollowedEvent,
} from '../../../common/event-bus/core/domain/events/social-interaction.events';
