import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';
import { Emotion } from '../emotion.entity';

const EVENT_NAME = 'emotion.created';

export class EmotionCreatedEvent extends BaseEvent {
  emotionId: string;
  userId: string;
  type: string;
  intensity: number;
  timestamp: Date;

  constructor(emotion: Emotion) {
    super();

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
}
