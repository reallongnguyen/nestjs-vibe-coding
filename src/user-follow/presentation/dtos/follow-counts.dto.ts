import { ApiProperty } from '@nestjs/swagger';
import { FollowCountsDto as ServiceFollowCountsDto } from '../../services/dtos/follow-counts.dto';

export class FollowCountsDto {
  @ApiProperty({ description: 'Number of followers' })
  followersCount: number;

  @ApiProperty({ description: 'Number of users being followed' })
  followingCount: number;

  static fromService(dto: ServiceFollowCountsDto): FollowCountsDto {
    const result = new FollowCountsDto();
    result.followersCount = dto.followersCount;
    result.followingCount = dto.followingCount;
    return result;
  }
}
