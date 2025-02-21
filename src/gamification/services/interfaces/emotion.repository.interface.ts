import { Emotion } from '../../entities/emotion.entity';

export type CreateEmotionInput = Pick<Emotion, 'type' | 'userId'>;

export interface IEmotionRepository {
  create(emotion: CreateEmotionInput): Promise<Emotion>;
  update(emotion: Emotion): Promise<Emotion>;
  findByUserIdAndHour(userId: string, date: Date): Promise<Emotion | null>;
}
