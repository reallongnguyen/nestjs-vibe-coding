import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

import { UserDto } from './user.dto';

export class ProfileDto extends UserDto {}

export class PatchProfileDto {
  @ApiProperty({
    description: "The user's full name",
    maxLength: 64,
    minLength: 3,
    required: false,
    example: 'Luffy',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'The avatar URL',
    maxLength: 256,
    required: false,
    example: 'https://image.com/avatars/luffy',
  })
  @IsString()
  @IsOptional()
  avatar?: string;
}
