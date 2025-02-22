import { ApiProperty } from '@nestjs/swagger';
import { EmotionType } from '../../entities/emotion.entity';

export class DailyEmotionDto {
  @ApiProperty({
    example: '2024-03-20',
    description: 'Date in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({
    enum: EmotionType,
    description: 'Most intense emotion of the day',
    example: EmotionType.JOY,
    nullable: true,
  })
  emotion: EmotionType | null;

  @ApiProperty({
    example: 3,
    description: 'Intensity of the emotion',
    minimum: 1,
    maximum: 5,
    nullable: true,
  })
  intensity: number | null;

  @ApiProperty({
    example: 'Had a great day!',
    description: 'Note for the emotion',
    required: false,
    nullable: true,
  })
  note: string | null;
}
