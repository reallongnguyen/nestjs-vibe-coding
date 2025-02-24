import { ApiProperty } from '@nestjs/swagger';

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

export class PublishedPostListItemDto extends PostListItemDto {
  @ApiProperty()
  publishedAt: Date;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  excerpt: string;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  author: PostAuthorDto;
}
