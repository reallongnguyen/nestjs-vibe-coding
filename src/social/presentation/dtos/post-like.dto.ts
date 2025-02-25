import { ApiProperty } from '@nestjs/swagger';

export class PostLikeResponseDto {
  @ApiProperty()
  liked: boolean;

  @ApiProperty()
  likeCount: number;
}
