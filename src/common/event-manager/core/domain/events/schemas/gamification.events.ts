import { EventSchema } from '../event.interface';

/**
 * Schema for emotion creation event
 */
interface EmotionCreatedSchema {
  emotionId: string;
  userId: string;
  type: string;
  intensity: number;
  timestamp: number;
}

/**
 * Schema for emotion deletion event
 */
interface EmotionDeletedSchema {
  emotionId: string;
  userId: string;
  type: string;
  timestamp: number;
}

/**
 * Schema for user emotion event
 */
interface UserEmotionSchema {
  userId: string;
  emotionType: string;
  intensity: number;
  context: Record<string, unknown>;
  timestamp: number;
}

/**
 * Schema for user streak update event
 */
interface UserStreakUpdateSchema {
  userId: string;
  streakType: string;
  currentStreak: number;
  longestStreak: number;
  timestamp: number;
}

/**
 * Schema for user streak reset event
 */
interface UserStreakResetSchema {
  userId: string;
  streakType: string;
  previousStreak: number;
  timestamp: number;
}

/**
 * Schema for achievement unlocked event
 */
interface AchievementUnlockedSchema {
  userId: string;
  achievementId: string;
  achievementType: string;
  achievementName: string;
  timestamp: number;
}

/**
 * Schema for achievement progress event
 */
interface AchievementProgressSchema {
  userId: string;
  achievementId: string;
  achievementType: string;
  currentProgress: number;
  requiredProgress: number;
  timestamp: number;
}

/**
 * All gamification related event schemas
 */
export const GamificationEventSchemas = {
  EMOTION_CREATED: {
    eventName: 'gamification.emotion.created',
    schema: {} as EmotionCreatedSchema,
    version: '1.0.0',
    module: 'gamification',
    description: 'Emitted when a user creates an emotion',
  } as EventSchema<EmotionCreatedSchema>,

  EMOTION_DELETED: {
    eventName: 'gamification.emotion.deleted',
    schema: {} as EmotionDeletedSchema,
    version: '1.0.0',
    module: 'gamification',
    description: 'Emitted when a user deletes an emotion',
  } as EventSchema<EmotionDeletedSchema>,

  USER_EMOTION_RECORDED: {
    eventName: 'gamification.emotion.recorded',
    schema: {} as UserEmotionSchema,
    version: '1.0.0',
    module: 'gamification',
    description: 'Emitted when a user emotion is recorded',
  } as EventSchema<UserEmotionSchema>,

  USER_STREAK_UPDATED: {
    eventName: 'gamification.streak.updated',
    schema: {} as UserStreakUpdateSchema,
    version: '1.0.0',
    module: 'gamification',
    description: 'Emitted when a user streak is updated',
  } as EventSchema<UserStreakUpdateSchema>,

  USER_STREAK_RESET: {
    eventName: 'gamification.streak.reset',
    schema: {} as UserStreakResetSchema,
    version: '1.0.0',
    module: 'gamification',
    description: 'Emitted when a user streak is reset',
  } as EventSchema<UserStreakResetSchema>,

  ACHIEVEMENT_UNLOCKED: {
    eventName: 'gamification.achievement.unlocked',
    schema: {} as AchievementUnlockedSchema,
    version: '1.0.0',
    module: 'gamification',
    description: 'Emitted when a user unlocks an achievement',
  } as EventSchema<AchievementUnlockedSchema>,

  ACHIEVEMENT_PROGRESS: {
    eventName: 'gamification.achievement.progress',
    schema: {} as AchievementProgressSchema,
    version: '1.0.0',
    module: 'gamification',
    description: 'Emitted when achievement progress is updated',
  } as EventSchema<AchievementProgressSchema>,
} as const;
