import { ApiProperty } from '@nestjs/swagger';

export class IsFollowingDto {
  @ApiProperty({
    description: 'Whether the user is following the target user',
    example: true,
  })
  isFollowing: boolean;

  static create(isFollowing: boolean): IsFollowingDto {
    const dto = new IsFollowingDto();
    dto.isFollowing = isFollowing;
    return dto;
  }
}
