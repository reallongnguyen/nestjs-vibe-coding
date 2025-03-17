import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentOutput } from 'src/social/services/dtos/comment.output';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CommentAuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiPropertyOptional()
  lastName: string | null;

  @ApiPropertyOptional()
  avatar: string | null;
}

export class BotAuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatar: string | null;
}

export class CommentDto implements CommentOutput {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ nullable: true })
  postId: string | null;

  @ApiPropertyOptional({ nullable: true })
  parentId: string | null;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  deletedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  botId: string | null;

  @ApiProperty()
  authorType: string;

  @ApiPropertyOptional()
  userAuthor?: CommentAuthorDto;

  @ApiPropertyOptional()
  botAuthor?: BotAuthorDto;

  @ApiProperty({ nullable: true })
  emotionId: string | null;

  @ApiProperty({ nullable: true })
  tweetId: string | null;

  static fromDomain(domain: CommentOutput): CommentDto {
    return { ...domain };
  }
}

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'This is a great post!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID for replies',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Updated comment content',
    example: 'This is an updated comment!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
