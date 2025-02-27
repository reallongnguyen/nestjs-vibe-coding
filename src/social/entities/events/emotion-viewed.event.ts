import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

export class EmotionViewedEvent extends BaseEvent {
  static readonly eventName = 'emotion.viewed';

  constructor(
    readonly payload: {
      emotionId: string;
      viewerHash: string;
      viewerId?: string;
      timestamp: Date;
    },
    params: {
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

  toJSON(): Record<string, unknown> {
    return {
      ...this.payload,
    };
  }
}
