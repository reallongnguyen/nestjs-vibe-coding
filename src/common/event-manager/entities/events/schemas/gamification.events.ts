import { IsEnum, IsNumber, IsUUID } from 'class-validator';
import { EventSchema } from '../event.interface';
import { EmotionType } from './emotion.types';

/**
 * Base payload for emotion events
 */
export class BaseEmotionEventPayload {
  @IsUUID()
  emotionId: string;

  @IsUUID()
  userId: string;

  @IsNumber()
  intensity: number;

  @IsEnum(EmotionType)
  type: EmotionType;
}

/**
 * Payload for emotion created event
 */
export class EmotionCreatedEventPayload extends BaseEmotionEventPayload {}

/**
 * Payload for emotion deleted event
 */
export class EmotionDeletedEventPayload extends BaseEmotionEventPayload {}

/**
 * All gamification related event schemas
 */
export const GamificationEventSchemas = {
  EMOTION_CREATED: {
    eventName: 'gamification.emotion.created',
    schema: new EmotionCreatedEventPayload(),
    version: '1.0.0',
    module: 'gamification',
    description: 'Emitted when an emotion is created',
  } as EventSchema<EmotionCreatedEventPayload>,

  EMOTION_DELETED: {
    eventName: 'gamification.emotion.deleted',
    schema: new EmotionDeletedEventPayload(),
    version: '1.0.0',
    module: 'gamification',
    description: 'Emitted when an emotion is deleted',
  } as EventSchema<EmotionDeletedEventPayload>,
} as const;
