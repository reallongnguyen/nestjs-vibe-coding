import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

export interface EmotionLikedEventPayload {
  emotionId: string;
  userId: string;
}

export class EmotionLikedEvent
  extends BaseEvent
  implements EmotionLikedEventPayload
{
  static readonly eventName = 'emotion.liked';

  constructor(
    readonly emotionId: string,
    readonly userId: string,
    params?: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ) {
    super(params);
  }

  eventName(): string {
    return EmotionLikedEvent.eventName;
  }

  toJSON(): EmotionLikedEventPayload {
    return {
      emotionId: this.emotionId,
      userId: this.userId,
    };
  }
}
