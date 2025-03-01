import { ApiProperty } from '@nestjs/swagger';

export class AuthorDto {
  @ApiProperty({ description: 'Author ID' })
  id: string;

  @ApiProperty({ description: 'Author first name' })
  firstName: string;

  @ApiProperty({ description: 'Author last name', required: false })
  lastName?: string | null;

  @ApiProperty({ description: 'Author avatar URL', required: false })
  avatar?: string | null;
}

export class ContentDetailsDto {
  @ApiProperty({ description: 'Content ID' })
  id: string;

  @ApiProperty({ description: 'Content title', required: false })
  title?: string;

  @ApiProperty({ description: 'Content body' })
  content: any;

  @ApiProperty({
    description: 'Emotion type for emotion content',
    required: false,
  })
  emotion?: string;

  @ApiProperty({ description: 'Emotion intensity', required: false })
  intensity?: number;

  @ApiProperty({ description: 'Content creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Content author' })
  author: AuthorDto;
}

export class ContentMetricsDto {
  @ApiProperty({ description: 'Number of likes' })
  likeCount: number;

  @ApiProperty({ description: 'Number of comments' })
  commentCount: number;

  @ApiProperty({ description: 'Number of views' })
  viewCount: number;
}

export class ContentDto {
  @ApiProperty({ description: 'Content ID' })
  id: string;

  @ApiProperty({ description: 'Content type', enum: ['POST', 'USER_EMOTION'] })
  type: 'POST' | 'USER_EMOTION';

  @ApiProperty({ description: 'Content details' })
  content: ContentDetailsDto;

  @ApiProperty({ description: 'Content metrics' })
  metrics: ContentMetricsDto;
}
