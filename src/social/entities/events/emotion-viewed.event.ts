import { v4 as uuid } from 'uuid';
import { BaseEvent } from 'src/common/event-manager/entities/events/base.event';
import { EventSchema } from 'src/common/event-manager/entities/events/event.interface';

export interface EmotionViewedEventPayload {
  emotionId: string;
  viewerHash: string;
  viewerId?: string;
}

/**
 * Custom schema for emotion viewed event
 */
const EMOTION_VIEWED_SCHEMA: EventSchema<EmotionViewedEventPayload> = {
  eventName: 'emotion.viewed',
  schema: {} as EmotionViewedEventPayload,
  version: '1.0.0',
  module: 'social',
  description: 'Emitted when an emotion is viewed',
};

/**
 * Event emitted when an emotion is viewed
 */
export class EmotionViewedEvent extends BaseEvent<EmotionViewedEventPayload> {
  /**
   * Create a new EmotionViewedEvent
   * @param emotionId ID of the emotion that was viewed
   * @param viewerHash Hash identifying the viewer
   * @param viewerId Optional ID of the logged-in viewer
   */
  constructor(
    private readonly emotionId: string,
    private readonly viewerHash: string,
    private readonly viewerId?: string,
  ) {
    super(EMOTION_VIEWED_SCHEMA, {
      correlationId: uuid(),
    });
  }

  /**
   * Convert to JSON representation
   * @returns JSON payload
   */
  toJSON(): EmotionViewedEventPayload {
    return {
      emotionId: this.emotionId,
      viewerHash: this.viewerHash,
      viewerId: this.viewerId,
    };
  }
}
