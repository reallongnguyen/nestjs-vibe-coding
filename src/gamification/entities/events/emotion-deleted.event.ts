import {
  BaseEvent,
  EmotionType,
  GamificationEventSchemas,
} from 'src/common/event-manager';

/**
 * Event emitted when an emotion is deleted
 */
export class EmotionDeletedEvent extends BaseEvent<
  typeof GamificationEventSchemas.EMOTION_DELETED.schema
> {
  constructor(
    private readonly emotionId: string,
    private readonly userId: string,
    private readonly intensity: number,
    private readonly type: EmotionType,
    params?: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ) {
    super(GamificationEventSchemas.EMOTION_DELETED, params);
  }

  toJSON() {
    return {
      emotionId: this.emotionId,
      userId: this.userId,
      intensity: this.intensity,
      type: this.type,
    };
  }
}

export { GamificationEventSchemas as EMOTION_EVENTS };
