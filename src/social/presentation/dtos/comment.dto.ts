import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Comment } from '../../entities/comment.entity';

export class CommentAuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  avatar?: string | null;
}

export class BotAuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatar?: string | null;
}

export class CommentDto implements Comment {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  postId: string;

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

  @ApiPropertyOptional()
  emotionId: string | null;

  static fromDomain(domain: Comment): CommentDto {
    return {
      id: domain.id,
      content: domain.content,
      postId: domain.postId,
      parentId: domain.parentId,
      userId: domain.userId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      deletedAt: domain.deletedAt,
      botId: domain.botId,
      authorType: domain.authorType,
      emotionId: domain.emotionId,
    };
  }
}
