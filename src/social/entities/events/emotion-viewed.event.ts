import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

export interface EmotionViewedEventPayload {
  emotionId: string;
  viewerHash: string;
  viewerId?: string;
}

export class EmotionViewedEvent
  extends BaseEvent
  implements EmotionViewedEventPayload
{
  static readonly eventName = 'emotion.viewed';

  constructor(
    readonly emotionId: string,
    readonly viewerHash: string,
    readonly viewerId?: string,
    params?: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ) {
    super(params);
  }

  eventName(): string {
    return EmotionViewedEvent.eventName;
  }

  toJSON(): EmotionViewedEventPayload {
    return {
      emotionId: this.emotionId,
      viewerHash: this.viewerHash,
      viewerId: this.viewerId,
    };
  }
}
