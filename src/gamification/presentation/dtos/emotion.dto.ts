import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { EmotionType, Emotion } from '../../entities/emotion.entity';

export class CreateEmotionDto {
  @ApiProperty({
    enum: EmotionType,
    description: 'Type of emotion',
    example: EmotionType.JOY,
  })
  @IsEnum(EmotionType)
  type: EmotionType;

  @ApiProperty({
    description: 'Optional note about the emotion',
    example: 'Feeling great after completing a task!',
    required: false,
    maxLength: 256,
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  note?: string;
}

export class EmotionResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the emotion',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Type of emotion (joy, sadness, anger, fear, joker)',
    example: 'joy',
  })
  type: string;

  @ApiProperty({
    description: 'Intensity level of the emotion (1-5)',
    example: 1,
    minimum: 1,
    maximum: 5,
  })
  intensity: number;

  @ApiProperty({
    description: 'Timestamp when the emotion was recorded',
    example: '2024-03-20T10:30:00Z',
  })
  timestamp: Date;

  @ApiProperty({ required: false })
  note?: string;

  static fromDomain(emotion: Emotion): EmotionResponseDto {
    return {
      id: emotion.id,
      type: emotion.type,
      intensity: emotion.intensity,
      timestamp: emotion.timestamp,
      note: emotion.note,
    };
  }
}
