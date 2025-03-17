import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Tweet } from '../../entities/tweet.entity';

export class TweetResponseDto {
  @ApiProperty({ description: 'Tweet ID' })
  id: string;

  @ApiProperty({ description: 'Tweet content' })
  content: string;

  @ApiProperty({ description: 'Array of image URLs', type: [String] })
  images: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Tweet archived status' })
  isArchived?: boolean;

  @ApiProperty({ description: 'Author information' })
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };

  @ApiPropertyOptional({ description: 'Engagement metrics' })
  engagement?: {
    likes: number;
    retweets: number;
    comments: number;
  };

  static fromEntity(tweet: Tweet, userInfo?: any): TweetResponseDto {
    return {
      id: tweet.id,
      content: tweet.content,
      images: tweet.images || [],
      createdAt: tweet.createdAt,
      updatedAt: tweet.updatedAt,
      isArchived: tweet.isArchived,
      author: userInfo || {
        id: tweet.userId,
        firstName: '',
        lastName: '',
      },
      engagement: {
        likes: 0,
        retweets: 0,
        comments: 0,
      },
    };
  }

  static fromEntities(tweets: Tweet[], usersInfo?: any[]): TweetResponseDto[] {
    return tweets.map((tweet, index) =>
      this.fromEntity(tweet, usersInfo?.[index]),
    );
  }
}
