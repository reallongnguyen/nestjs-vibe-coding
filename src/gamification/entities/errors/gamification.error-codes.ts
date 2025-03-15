/**
 * Standardized error codes for the Gamification module
 * These codes are used by the error factory to create specific error instances
 */
export enum GamificationErrorCode {
  // Emotion errors
  EMOTION_INVALID_TYPE = 'EMOTION_INVALID_TYPE',
  EMOTION_NOT_FOUND = 'EMOTION_NOT_FOUND',
  EMOTION_CREATE_FAILED = 'EMOTION_CREATE_FAILED',

  // Streak errors
  STREAK_NOT_FOUND = 'STREAK_NOT_FOUND',
  STREAK_UPDATE_FAILED = 'STREAK_UPDATE_FAILED',

  // Achievement errors
  ACHIEVEMENT_NOT_FOUND = 'ACHIEVEMENT_NOT_FOUND',
  ACHIEVEMENT_ALREADY_EARNED = 'ACHIEVEMENT_ALREADY_EARNED',
}
