import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { EventBusPort } from 'src/common/event-bus/core/ports/event-bus.port';
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
    @Inject('EventBusPort')
    private readonly eventBus: EventBusPort,
  ) {}

  async execute(params: CreateEmotionDto): Promise<Emotion> {
    const existingEmotion = await this.emotionRepository.findByUserIdAndHour(
      params.userId,
      new Date(),
    );

    let emotion: Emotion;

    if (existingEmotion) {
      if (existingEmotion.type === params.type) {
        existingEmotion.intensity = Math.min(existingEmotion.intensity + 1, 5);
        emotion = await this.emotionRepository.update(existingEmotion);
      } else {
        existingEmotion.type = params.type;
        existingEmotion.intensity = 1;
        emotion = await this.emotionRepository.update(existingEmotion);
      }
    } else {
      emotion = await this.emotionRepository.create({
        userId: params.userId,
        type: params.type,
      });
    }

    this.logger.log('Emotion created', { emotionId: emotion.id });

    this.eventBus.publish(new EmotionCreatedEvent(emotion));

    return emotion;
  }
}
