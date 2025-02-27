import { ApiProperty } from '@nestjs/swagger';

export class LikeResponseDto {
  @ApiProperty()
  liked: boolean;

  @ApiProperty()
  likeCount: number;
}
