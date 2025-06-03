import { COMMON_ERRORS } from './common.errors';
import { FEED_ERRORS } from '../../feed/errors/feed.errors';
import { IDENTITY_ERRORS } from '../../identity/entities/errors/identity.errors';
import { NOTIFICATION_ERRORS } from '../../notification/entities/errors/notification.errors';
import { SOCIAL_ERRORS } from '../../social/entities/errors/social.errors';
import { STORAGE_ERRORS } from '../../storage/errors/storage.errors';
import { ErrorDefinition } from './app.error';

/**
 * A registry of all application-specific error definitions.
 * This object merges error definitions from various modules across the application,
 * providing a single source of truth for all possible errors.
 *
 * Each key in this record represents a unique error code, and its value
 * is an ErrorDefinition object containing the error message and HTTP status code.
 */
export const ALL_APP_ERRORS: Record<string, ErrorDefinition> = {
  ...COMMON_ERRORS,
  ...FEED_ERRORS,
  ...IDENTITY_ERRORS,
  ...NOTIFICATION_ERRORS,
  ...SOCIAL_ERRORS,
  ...STORAGE_ERRORS,
};
