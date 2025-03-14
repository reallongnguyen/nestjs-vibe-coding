import { v4 as uuid } from 'uuid';
import { BaseEvent } from 'src/common/event-manager/entities/events/base.event';
import { EventSchema } from 'src/common/event-manager/entities/events/event.interface';

export interface EmotionUnlikedEventPayload {
  emotionId: string;
  userId: string;
}

/**
 * Custom schema for emotion unliked event
 */
const EMOTION_UNLIKED_SCHEMA: EventSchema<EmotionUnlikedEventPayload> = {
  eventName: 'emotion.unliked',
  schema: {} as EmotionUnlikedEventPayload,
  version: '1.0.0',
  module: 'social',
  description: 'Emitted when a user unlikes an emotion',
};

/**
 * Event emitted when a user unlikes an emotion
 */
export class EmotionUnlikedEvent extends BaseEvent<EmotionUnlikedEventPayload> {
  /**
   * Create a new EmotionUnlikedEvent
   * @param emotionId ID of the emotion that was unliked
   * @param userId ID of the user who unliked the emotion
   */
  constructor(
    private readonly emotionId: string,
    private readonly userId: string,
  ) {
    super(EMOTION_UNLIKED_SCHEMA, {
      correlationId: uuid(),
    });
  }

  /**
   * Convert to JSON representation
   * @returns JSON payload
   */
  toJSON(): EmotionUnlikedEventPayload {
    return {
      emotionId: this.emotionId,
      userId: this.userId,
    };
  }
}
