import { ApiProperty } from '@nestjs/swagger';

export class StoryNodePositionDto {
  @ApiProperty({
    description: 'Story ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'X coordinate for visual layout',
    example: 0,
  })
  x: number;

  @ApiProperty({
    description: 'Y coordinate for visual layout',
    example: 0,
  })
  y: number;

  @ApiProperty({
    description: 'Level in the tree (depth)',
    example: 0,
  })
  level: number;

  @ApiProperty({
    description: 'Index within level (horizontal position)',
    example: 0,
  })
  index: number;

  @ApiProperty({
    description: 'Parent story ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  parentId: string | null;

  @ApiProperty({
    description: 'Child story IDs',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  childrenIds: string[];
}

export class ChainVisualizationDto {
  @ApiProperty({
    description: 'Array of story nodes with position data',
    type: [StoryNodePositionDto],
  })
  nodes: StoryNodePositionDto[];

  @ApiProperty({
    description: 'Root story ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  rootId: string;

  @ApiProperty({
    description: 'Maximum width of the visualization (nodes in widest row)',
    example: 3,
  })
  width: number;

  @ApiProperty({
    description: 'Maximum height of the visualization (depth of tree)',
    example: 4,
  })
  height: number;

  @ApiProperty({
    description: 'Connections between nodes (parent-child)',
    type: [Object],
    example: [{ source: 'story-id-1', target: 'story-id-2' }],
  })
  connections: Array<{ source: string; target: string }>;
}
