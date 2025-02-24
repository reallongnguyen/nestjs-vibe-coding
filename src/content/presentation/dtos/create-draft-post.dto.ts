import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsObject,
} from 'class-validator';
import { CreateDraftPostData } from '../../services/dtos/create-daft-post.dto';

export class CreateDraftPostDto {
  @ApiProperty({ description: 'Post title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Post subtitle' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiProperty({ description: 'Post content in JSON format' })
  @IsObject()
  @IsNotEmpty()
  content: Record<string, any>;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsString()
  @IsOptional()
  cover?: string;

  @ApiProperty({ description: 'Array of topic IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];

  toData(userId: string): CreateDraftPostData {
    return {
      title: this.title,
      subtitle: this.subtitle,
      content: this.content,
      cover: this.cover,
      topics: this.topics ?? [],
      userId,
    };
  }
}
