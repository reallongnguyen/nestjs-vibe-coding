import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

import { UpsertUserInput } from '../../services/dto/user.input';

export class CreateUserDto {
  @ApiProperty({
    description: "The user's full name",
    maxLength: 64,
    minLength: 3,
    required: false,
    example: 'Luffy',
  })
  @IsString()
  @Length(3, 64)
  name: string;

  @ApiProperty({
    description: 'The avatar URL',
    maxLength: 256,
    required: false,
    example: 'https://image.com/avatars/luffy',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  avatar?: string;

  static toApplication(
    dto: CreateUserDto,
    authId: string,
    email?: string,
    phoneNumber?: string,
  ): UpsertUserInput {
    return {
      authId,
      name: dto.name,
      avatar: dto.avatar,
      email,
      phoneNumber,
    };
  }
}
