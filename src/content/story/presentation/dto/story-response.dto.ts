import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StoryAuthorDto {
  @ApiProperty({
    description: 'User ID of the author',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'First name of the author',
    example: 'John',
  })
  firstName: string;

  @ApiPropertyOptional({
    description: 'Last name of the author',
    example: 'Doe',
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL of the author',
    example: 'https://example.com/avatar.jpg',
  })
  avatar?: string;
}

export class StoryResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the story',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Content of the story',
    example: 'Once upon a time in a land far, far away...',
  })
  content: string;

  @ApiPropertyOptional({
    description: 'Array of image URLs',
    type: [String],
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
  })
  images: string[];

  @ApiPropertyOptional({
    description: 'ID of the parent story',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  parentId: string | null;

  @ApiPropertyOptional({
    description: 'ID of the root story (the first story in the chain)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  rootId: string | null;

  @ApiProperty({
    description: 'Position in the story chain',
    example: 0,
  })
  chainPosition: number;

  @ApiProperty({
    description: 'Author of the story',
    type: StoryAuthorDto,
  })
  author: StoryAuthorDto;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
