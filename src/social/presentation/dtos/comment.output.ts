import { ApiProperty } from '@nestjs/swagger';
import { Comment } from '../../entities/comment.entity';
import { CommentOutput } from '../../services/dtos/comment.output';

export class CommentDto implements Comment {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  postId: string | null;

  @ApiProperty({ required: false })
  parentId: string | null;

  @ApiProperty()
  userId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  userAuthor?: {
    id: string;
    firstName: string;
    lastName?: string;
    avatar?: string | null;
  };

  @ApiProperty()
  botAuthor?: {
    id: string;
    name: string;
    avatar?: string | null;
  };

  @ApiProperty({ required: false, description: 'Deletion date of the comment' })
  deletedAt: Date | null;

  @ApiProperty({
    required: false,
    description: 'ID of the bot author if comment was created by a bot',
  })
  botId: string | null;

  @ApiProperty({ description: 'Type of author - either "user" or "bot"' })
  authorType: string;

  @ApiProperty({ description: 'ID of the emotion if comment is on an emotion' })
  emotionId: string | null;

  @ApiProperty({ description: 'ID of the tweet if comment is on a tweet' })
  tweetId: string | null;

  @ApiProperty({ description: 'ID of the story if comment is on a story' })
  storyId: string | null;

  static fromApplication(comment: CommentOutput): CommentDto {
    return {
      ...comment,
    };
  }
}
