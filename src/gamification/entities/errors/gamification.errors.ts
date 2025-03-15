import { HttpStatus } from '@nestjs/common';
import { ErrorDefinition } from 'src/common/errors/app.error';
import { GamificationErrorCode } from './gamification.error-codes';

/**
 * Error definitions for Gamification module
 * Each error code maps to a message template and HTTP status code
 */
export const GAMIFICATION_ERRORS: Record<
  GamificationErrorCode,
  ErrorDefinition
> = {
  // Emotion errors
  [GamificationErrorCode.EMOTION_INVALID_TYPE]: {
    message: 'Invalid emotion type',
    status: HttpStatus.BAD_REQUEST,
  },
  [GamificationErrorCode.EMOTION_NOT_FOUND]: {
    message: 'Emotion not found',
    status: HttpStatus.NOT_FOUND,
  },
  [GamificationErrorCode.EMOTION_CREATE_FAILED]: {
    message: 'Failed to create emotion: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // Streak errors
  [GamificationErrorCode.STREAK_NOT_FOUND]: {
    message: 'User streak not found',
    status: HttpStatus.NOT_FOUND,
  },
  [GamificationErrorCode.STREAK_UPDATE_FAILED]: {
    message: 'Failed to update streak: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // Achievement errors
  [GamificationErrorCode.ACHIEVEMENT_NOT_FOUND]: {
    message: 'Achievement not found',
    status: HttpStatus.NOT_FOUND,
  },
  [GamificationErrorCode.ACHIEVEMENT_ALREADY_EARNED]: {
    message: 'Achievement already earned',
    status: HttpStatus.CONFLICT,
  },
};
