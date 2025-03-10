import { ApiProperty } from '@nestjs/swagger';
import { FeedItem } from '../../entities/feed.entity';
import { FeedContent } from '../../entities/feed.types';

export class FeedContentDto implements FeedContent {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty({ required: false })
  score?: number;

  @ApiProperty({ required: false })
  metadata?: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(domain: FeedContent): FeedContentDto {
    const dto = new FeedContentDto();
    Object.assign(dto, domain);
    return dto;
  }
}

export class FeedItemDto implements FeedItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  score: number;

  @ApiProperty({ type: FeedContentDto })
  content: FeedContent;

  @ApiProperty({ required: false })
  metadata?: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromDomain(domain: FeedItem): FeedItemDto {
    const dto = new FeedItemDto();
    Object.assign(dto, {
      ...domain,
      content: FeedContentDto.fromDomain(domain.content),
    });
    return dto;
  }
}
