import { ApiProperty } from '@nestjs/swagger';
import { Feed, FeedContentType } from '../../entities/feed.entity';
import {
  PostContent,
  EmotionContent,
} from '../../entities/feed-content.entity';

class UserDto {
  @ApiProperty({
    type: String,
    description: 'Unique identifier of the user',
  })
  id: string;

  @ApiProperty({
    type: String,
    description: 'First name of the user',
  })
  firstName: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Last name of the user',
  })
  lastName?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Avatar URL of the user',
  })
  avatar?: string;
}

class PostContentDto implements PostContent {
  @ApiProperty({
    type: String,
    description: 'Unique identifier of the post',
  })
  id: string;

  @ApiProperty({
    type: String,
    description: 'Title of the post',
  })
  title: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Subtitle of the post',
  })
  subtitle?: string;

  @ApiProperty({
    type: String,
    description: 'Excerpt of the post content',
  })
  excerpt: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Cover image URL of the post',
  })
  cover?: string;

  @ApiProperty({
    type: Number,
    description: 'Estimated reading time in minutes',
  })
  readingTime: number;

  @ApiProperty({
    type: Number,
    description: 'Number of likes',
  })
  likeCount: number;

  @ApiProperty({
    type: Number,
    description: 'Number of replies',
  })
  replyCount: number;

  @ApiProperty({
    type: Number,
    description: 'Number of views',
  })
  viewCount: number;

  @ApiProperty({
    type: Date,
    description: 'Publication date',
  })
  publishedAt: Date;

  @ApiProperty({
    type: UserDto,
    description: 'Author of the post',
  })
  author: UserDto;
}

class EmotionContentDto implements EmotionContent {
  @ApiProperty({
    type: String,
    description: 'Unique identifier of the emotion',
  })
  id: string;

  @ApiProperty({
    type: String,
    description: 'Type of emotion',
  })
  emotion: string;

  @ApiProperty({
    type: Number,
    description: 'Intensity of the emotion (1-5)',
  })
  intensity: number;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Optional note about the emotion',
  })
  note?: string;

  @ApiProperty({
    type: Date,
    description: 'Date of the emotion',
  })
  date: Date;

  @ApiProperty({
    type: UserDto,
    description: 'User who logged the emotion',
  })
  user: UserDto;
}

export class FeedItemDto implements Omit<Feed, 'userId'> {
  @ApiProperty({
    type: String,
    description: 'Unique identifier of the feed item',
  })
  id: string;

  @ApiProperty({
    enum: FeedContentType,
    description: 'Type of content in the feed (e.g., post, emotion)',
  })
  contentType: FeedContentType;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Identifier of the referenced post',
  })
  publishedPostId: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Identifier of the referenced emotion',
  })
  userEmotionId: string | null;

  @ApiProperty({
    type: Number,
    description: 'Relevance score for feed ranking',
  })
  score: number;

  @ApiProperty({
    type: Date,
    required: false,
    nullable: true,
    description: 'Timestamp when the user viewed this feed item',
  })
  viewedAt: Date | null;

  @ApiProperty({
    type: Date,
    description: 'Timestamp when the feed item was created',
  })
  createdAt: Date;

  @ApiProperty({
    type: Date,
    description: 'Timestamp when the feed item was last updated',
  })
  updatedAt: Date;

  @ApiProperty({
    type: PostContentDto,
    required: false,
    nullable: true,
    description: 'Post content if contentType is POST',
  })
  publishedPost: PostContent | null;

  @ApiProperty({
    type: EmotionContentDto,
    required: false,
    nullable: true,
    description: 'Emotion content if contentType is USER_EMOTION',
  })
  userEmotion: EmotionContent | null;

  static fromApplication(feed: Feed): FeedItemDto {
    return {
      id: feed.id,
      contentType: feed.contentType,
      publishedPostId: feed.publishedPostId,
      userEmotionId: feed.userEmotionId,
      score: feed.score,
      viewedAt: feed.viewedAt,
      createdAt: feed.createdAt,
      updatedAt: feed.updatedAt,
      publishedPost: feed.publishedPost,
      userEmotion: feed.userEmotion,
    };
  }
}
