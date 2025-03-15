import {
  AchievementAlreadyEarnedError,
  AchievementNotFoundError,
  EmotionCreateError,
  EmotionInvalidTypeError,
  EmotionNotFoundError,
  StreakNotFoundError,
  StreakUpdateError,
} from './gamification.error-classes';

/**
 * Factory for creating Gamification module errors
 * Provides a consistent way to create error instances
 */
export class GamificationErrorFactory {
  /**
   * Creates an error for when an invalid emotion type is provided
   * @returns EmotionInvalidTypeError
   */
  static emotionInvalidType(): EmotionInvalidTypeError {
    return new EmotionInvalidTypeError();
  }

  /**
   * Creates an error for when an emotion is not found
   * @returns EmotionNotFoundError
   */
  static emotionNotFound(): EmotionNotFoundError {
    return new EmotionNotFoundError();
  }

  /**
   * Creates an error for when emotion creation fails
   * @param cause - The original error
   * @returns EmotionCreateError
   */
  static emotionCreateFailed(cause?: Error): EmotionCreateError {
    return new EmotionCreateError(cause);
  }

  /**
   * Creates an error for when a streak is not found
   * @returns StreakNotFoundError
   */
  static streakNotFound(): StreakNotFoundError {
    return new StreakNotFoundError();
  }

  /**
   * Creates an error for when streak update fails
   * @param cause - The original error
   * @returns StreakUpdateError
   */
  static streakUpdateFailed(cause?: Error): StreakUpdateError {
    return new StreakUpdateError(cause);
  }

  /**
   * Creates an error for when an achievement is not found
   * @returns AchievementNotFoundError
   */
  static achievementNotFound(): AchievementNotFoundError {
    return new AchievementNotFoundError();
  }

  /**
   * Creates an error for when an achievement is already earned
   * @returns AchievementAlreadyEarnedError
   */
  static achievementAlreadyEarned(): AchievementAlreadyEarnedError {
    return new AchievementAlreadyEarnedError();
  }
}
