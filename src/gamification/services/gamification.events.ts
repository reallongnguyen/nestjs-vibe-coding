import { Injectable } from '@nestjs/common';
import {
  IEventBus,
  InjectEventBus,
  EmotionType,
} from '../../common/event-manager';
import { EmotionCreatedEvent } from '../entities/events/emotion-created.event';
import { EmotionDeletedEvent } from '../entities/events/emotion-deleted.event';

@Injectable()
export class GamificationEvents {
  constructor(@InjectEventBus() private readonly eventBus: IEventBus) {}

  async emitEmotionCreated(
    emotionId: string,
    userId: string,
    intensity: number,
    type: EmotionType,
    params?: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ): Promise<void> {
    const event = new EmotionCreatedEvent(
      emotionId,
      userId,
      intensity,
      type,
      params,
    );

    await this.eventBus.publish(event);
  }

  async emitEmotionDeleted(
    emotionId: string,
    userId: string,
    intensity: number,
    type: EmotionType,
    params?: {
      correlationId?: string;
      metadata?: Record<string, unknown>;
      occurredOn?: Date;
    },
  ): Promise<void> {
    const event = new EmotionDeletedEvent(
      emotionId,
      userId,
      intensity,
      type,
      params,
    );

    await this.eventBus.publish(event);
  }
}
