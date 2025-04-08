import { ApiProperty } from '@nestjs/swagger';
import { StoryResponseDto } from './story-response.dto';

export class StoryNodeDto extends StoryResponseDto {
  @ApiProperty({
    description: 'Array of child stories in the chain',
    isArray: true,
    type: 'array',
    items: {
      type: 'object',
    },
  })
  children: this[];
}

export class ChainResponseDto {
  @ApiProperty({
    description: 'Root story of the chain',
    type: StoryNodeDto,
  })
  root: StoryNodeDto;

  @ApiProperty({
    description: 'Total number of stories in the chain',
    example: 5,
  })
  totalStories: number;

  @ApiProperty({
    description: 'Maximum depth of the chain',
    example: 3,
  })
  maxDepth: number;
}
