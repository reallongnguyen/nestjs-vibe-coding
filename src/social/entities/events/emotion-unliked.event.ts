import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

export class EmotionUnlikedEvent extends BaseEvent {
  static readonly eventName = 'emotion.unliked';

  constructor(
    readonly payload: {
      emotionId: string;
      userId: string;
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
    return EmotionUnlikedEvent.eventName;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...this.payload,
    };
  }
}
