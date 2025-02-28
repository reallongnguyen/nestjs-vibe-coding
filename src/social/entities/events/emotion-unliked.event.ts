import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

export interface EmotionUnlikedEventPayload {
  emotionId: string;
  userId: string;
}

export class EmotionUnlikedEvent
  extends BaseEvent
  implements EmotionUnlikedEventPayload
{
  static readonly eventName = 'emotion.unliked';

  constructor(
    readonly emotionId: string,
    readonly userId: string,

    params: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ) {
    super(params);
  }

  eventName(): string {
    return EmotionUnlikedEvent.eventName;
  }

  toJSON(): EmotionUnlikedEventPayload {
    return {
      emotionId: this.emotionId,
      userId: this.userId,
    };
  }
}
