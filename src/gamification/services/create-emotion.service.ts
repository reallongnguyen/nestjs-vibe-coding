import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { IEventBus, InjectEventBus } from 'src/common/event-manager';

import { Emotion } from '../entities/emotion.entity';
import { IEmotionRepository } from './interfaces/emotion.repository.interface';
import { CreateEmotionDto } from './dtos/create-emotion.dto';
import { EmotionCreatedEvent } from '../entities/events/emotion-created.event';

@Injectable()
export class CreateEmotionService {
  constructor(
    private readonly logger: Logger,
    @Inject('IEmotionRepository')
    private readonly emotionRepository: IEmotionRepository,
    @InjectEventBus()
    private readonly eventBus: IEventBus,
  ) {}

  async execute(params: CreateEmotionDto): Promise<Emotion> {
    const emotion = await this.emotionRepository.create({
      userId: params.userId,
      type: params.type,
      note: params.note,
    });

    this.eventBus.publish(
      new EmotionCreatedEvent(
        emotion.id,
        emotion.userId,
        emotion.intensity,
        emotion.type as any,
      ),
    );
    return emotion;
  }
}
