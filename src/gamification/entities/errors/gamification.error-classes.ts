import { AppError } from '../../../common/errors/app.error';
import { GamificationErrorCode } from './gamification.error-codes';
import { GAMIFICATION_ERRORS } from './gamification.errors';

/**
 * Base error class for Gamification module errors
 */
export class GamificationError extends AppError {
  constructor(code: GamificationErrorCode, params?: Record<string, any>) {
    const errorCode = `gamification.${code}`;
    super(errorCode, { message: code, status: 500 }, { params });
  }
}

/**
 * Emotion-related error classes
 */
export class EmotionInvalidTypeError extends AppError {
  constructor() {
    super(
      GamificationErrorCode.EMOTION_INVALID_TYPE,
      GAMIFICATION_ERRORS[GamificationErrorCode.EMOTION_INVALID_TYPE],
    );
  }
}

export class EmotionNotFoundError extends AppError {
  constructor() {
    super(
      GamificationErrorCode.EMOTION_NOT_FOUND,
      GAMIFICATION_ERRORS[GamificationErrorCode.EMOTION_NOT_FOUND],
    );
  }
}

export class EmotionCreateError extends AppError {
  constructor(cause?: Error) {
    super(
      GamificationErrorCode.EMOTION_CREATE_FAILED,
      GAMIFICATION_ERRORS[GamificationErrorCode.EMOTION_CREATE_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Streak-related error classes
 */
export class StreakNotFoundError extends AppError {
  constructor() {
    super(
      GamificationErrorCode.STREAK_NOT_FOUND,
      GAMIFICATION_ERRORS[GamificationErrorCode.STREAK_NOT_FOUND],
    );
  }
}

export class StreakUpdateError extends AppError {
  constructor(cause?: Error) {
    super(
      GamificationErrorCode.STREAK_UPDATE_FAILED,
      GAMIFICATION_ERRORS[GamificationErrorCode.STREAK_UPDATE_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Achievement-related error classes
 */
export class AchievementNotFoundError extends AppError {
  constructor() {
    super(
      GamificationErrorCode.ACHIEVEMENT_NOT_FOUND,
      GAMIFICATION_ERRORS[GamificationErrorCode.ACHIEVEMENT_NOT_FOUND],
    );
  }
}

export class AchievementAlreadyEarnedError extends AppError {
  constructor() {
    super(
      GamificationErrorCode.ACHIEVEMENT_ALREADY_EARNED,
      GAMIFICATION_ERRORS[GamificationErrorCode.ACHIEVEMENT_ALREADY_EARNED],
    );
  }
}
