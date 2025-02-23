import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';
import { Emotion } from '../emotion.entity';

const EVENT_NAME = 'emotion.created';

export class EmotionCreatedEvent extends BaseEvent {
  emotionId: string;
  userId: string;
  type: string;
  intensity: number;
  timestamp: Date;

  constructor(
    emotion: Emotion,
    params?: ConstructorParameters<typeof BaseEvent>[0],
  ) {
    super(params);

    this.emotionId = emotion.id;
    this.userId = emotion.userId;
    this.type = emotion.type;
    this.intensity = emotion.intensity;
    this.timestamp = emotion.timestamp;
  }

  eventName(): string {
    return EVENT_NAME;
  }

  static getName(): string {
    return EVENT_NAME;
  }

  toJSON(): Record<string, unknown> {
    return {
      emotionId: this.emotionId,
      userId: this.userId,
      type: this.type,
      intensity: this.intensity,
      timestamp: this.timestamp,
    };
  }
}
