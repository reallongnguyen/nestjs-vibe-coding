import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Comment } from '../../entities/comment.entity';
import { CommentOutput } from '../../services/dtos/comment.output';

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
  likeCount: number;

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

  static fromDomain(comment: CommentOutput): CommentDto {
    return {
      ...comment,
    };
  }
}
