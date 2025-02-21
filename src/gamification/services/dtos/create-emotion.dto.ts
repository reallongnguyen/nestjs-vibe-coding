import { EmotionType } from '../../entities/emotion.entity';

export class CreateEmotionDto {
  userId: string;

  type: EmotionType;
}
