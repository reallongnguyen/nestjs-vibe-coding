import { ApiProperty } from '@nestjs/swagger';

export class EngagementStatsDto {
  @ApiProperty({ description: 'Number of likes' })
  likeCount: number;

  @ApiProperty({ description: 'Number of views' })
  viewCount: number;

  @ApiProperty({ description: 'Number of comments' })
  commentCount: number;
}
