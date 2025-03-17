import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTweetDto {
  @ApiProperty({
    description: 'Content of the tweet',
    example: 'This is my first tweet!',
    maxLength: 280,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  content: string;

  @ApiProperty({
    description: 'Array of image URLs',
    example: ['https://example.com/image1.jpg'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  images: string[] = [];
}

export class UpdateTweetDto {
  @ApiPropertyOptional({
    description: 'Content of the tweet',
    example: 'This is my updated tweet!',
    maxLength: 280,
  })
  @IsString()
  @IsOptional()
  @MaxLength(280)
  content?: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs',
    example: ['https://example.com/image1.jpg'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  images?: string[];
}
