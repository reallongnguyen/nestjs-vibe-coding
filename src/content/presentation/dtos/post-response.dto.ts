import { ApiProperty } from '@nestjs/swagger';
import { DraftPost } from '../../entities/draft-post.entity';
import { PublishedPost } from '../../entities/published-post.entity';

export class PostListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  subtitle?: string;

  @ApiProperty()
  content: Record<string, any>;

  @ApiProperty({ required: false })
  cover?: string;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [String] })
  topics: string[];
}

export class DraftPostListItemDto extends PostListItemDto {
  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  published: boolean;

  @ApiProperty({ required: false })
  publishedId?: string;
}

export class PostAuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  avatar?: string;
}

export class DraftPostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false, nullable: true })
  subtitle: string | null;

  @ApiProperty({ type: Object })
  content: Record<string, any>;

  @ApiProperty({ required: false, nullable: true })
  cover: string | null;

  @ApiProperty({ type: [String] })
  topics: string[];

  @ApiProperty({ required: false, nullable: true })
  publishedId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(draft: DraftPost): DraftPostResponseDto {
    return {
      id: draft.id,
      title: draft.title,
      subtitle: draft.subtitle,
      content: draft.content,
      cover: draft.cover,
      topics: draft.topics,
      publishedId: draft.publishedId,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    };
  }
}

export class PublishedPostResponseDto extends PublishedPost {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false, nullable: true })
  subtitle: string | null;

  @ApiProperty({ type: Object })
  content: Record<string, any>;

  @ApiProperty({ required: false, nullable: true })
  cover: string | null;

  @ApiProperty()
  publishedAt: Date;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  excerpt: string;

  static fromDomain(post: PublishedPost): PublishedPostResponseDto {
    return {
      ...post,
    };
  }
}
