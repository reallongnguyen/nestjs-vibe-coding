import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublishedPostWithAuthor } from '../../entities/published-post.entity';

export class PublishedPostDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Post title' })
  title: string;

  @ApiPropertyOptional({ description: 'Post subtitle' })
  subtitle?: string;

  @ApiProperty({ description: 'Post slug' })
  slug: string;

  @ApiProperty({ description: 'Post content' })
  content: Record<string, any>;

  @ApiProperty({ description: 'Post excerpt' })
  excerpt: string;

  @ApiPropertyOptional({ description: 'Post cover image URL' })
  cover?: string;

  @ApiProperty({ description: 'Post reading time in minutes' })
  readingTime: number;

  @ApiProperty({ description: 'Post topics' })
  topics: string[];

  @ApiProperty({ description: 'Post published date' })
  publishedAt: Date;

  @ApiProperty({ description: 'Post last updated date' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Post author' })
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };

  static fromDomain(domain: PublishedPostWithAuthor): PublishedPostDto {
    return {
      id: domain.id,
      title: domain.title,
      subtitle: domain.subtitle,
      slug: domain.slug,
      content: domain.content,
      excerpt: domain.excerpt,
      cover: domain.cover,
      readingTime: domain.readingTime,
      topics: domain.topics,
      publishedAt: domain.publishedAt,
      updatedAt: domain.updatedAt,
      metadata: domain.metadata,
      author: domain.userAuthor
        ? {
            id: domain.userAuthor.id,
            firstName: domain.userAuthor.firstName,
            lastName: domain.userAuthor.lastName,
            avatar: domain.userAuthor.avatar,
          }
        : null,
    };
  }
}
