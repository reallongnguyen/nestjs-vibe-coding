import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Emotion, EmotionType } from '../entities/emotion.entity';
import { IEmotionRepository } from '../services/interfaces/emotion.repository.interface';

@Injectable()
export class EmotionPrismaRepository implements IEmotionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(emotion: Pick<Emotion, 'userId' | 'type'>): Promise<Emotion> {
    const created = await this.prisma.userEmotion.create({
      data: {
        userId: emotion.userId,
        emotion: emotion.type,
        date: new Date(),
        timestamp: new Date(),
      },
    });

    return this.mapToEntity(created);
  }

  async update(emotion: Emotion): Promise<Emotion> {
    const updated = await this.prisma.userEmotion.update({
      where: { id: emotion.id },
      data: {
        emotion: emotion.type,
        intensity: emotion.intensity,
      },
    });
    return this.mapToEntity(updated);
  }

  async findByUserIdAndHour(
    userId: string,
    date: Date,
  ): Promise<Emotion | null> {
    const startOfHour = new Date(date.setMinutes(0, 0, 0));
    const endOfHour = new Date(date.setMinutes(59, 59, 999));

    const emotion = await this.prisma.userEmotion.findFirst({
      where: {
        userId,
        timestamp: {
          gte: startOfHour,
          lte: endOfHour,
        },
      },
    });

    return emotion ? this.mapToEntity(emotion) : null;
  }

  private mapToEntity(prismaEmotion: any): Emotion {
    return new Emotion({
      id: prismaEmotion.id,
      userId: prismaEmotion.userId,
      type: prismaEmotion.emotion as EmotionType,
      intensity: prismaEmotion.intensity,
      timestamp: prismaEmotion.timestamp,
    });
  }
}
