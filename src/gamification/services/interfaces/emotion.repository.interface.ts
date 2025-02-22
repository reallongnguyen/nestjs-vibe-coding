import { Emotion } from '../../entities/emotion.entity';

export interface IEmotionRepository {
  create(emotion: Pick<Emotion, 'userId' | 'type' | 'note'>): Promise<Emotion>;
  update(emotion: Emotion): Promise<Emotion>;
  findByUserIdAndHour(userId: string, date: Date): Promise<Emotion | null>;
  findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Emotion[]>;
}
