import { ApiProperty } from '@nestjs/swagger';
import { FollowerDto as ServiceFollowerDto } from '../../services/dtos/follower.dto';

export class FollowerDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @ApiProperty({ description: 'User last name', required: false })
  lastName: string | null;

  @ApiProperty({ description: 'User avatar URL', required: false })
  avatar: string | null;

  @ApiProperty({ description: 'When the follow relationship was created' })
  followedAt: Date;

  static fromService(dto: ServiceFollowerDto): FollowerDto {
    const result = new FollowerDto();
    result.id = dto.id;
    result.firstName = dto.firstName;
    result.lastName = dto.lastName;
    result.avatar = dto.avatar;
    result.followedAt = dto.followedAt;
    return result;
  }
}
