import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsUUID, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { TweetImageMimeType } from '../models/file-type.enum';

export class GetTweetImageUploadUrlDto {
  @ApiProperty({
    description: 'file size in bytes',
    type: Number,
    example: 1024,
  })
  @Max(10000000) // 10MB max
  @Min(1)
  @IsInt()
  @Transform(({ value }) => Number(value))
  @IsNotEmpty()
  size: number;

  @ApiProperty({
    description: 'file type',
    type: String,
    enum: TweetImageMimeType,
    example: 'image/jpeg',
  })
  @IsEnum(TweetImageMimeType)
  @IsNotEmpty()
  mimeType: TweetImageMimeType;

  @ApiProperty({
    description: 'Tweet ID',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  tweetId: string;
}
