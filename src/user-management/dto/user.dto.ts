import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';

export class UserCreateDto {
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
}

export class UserDto implements Omit<User, 'createdAt' | 'updatedAt'> {
  @ApiProperty({
    example: '018fb0ab-f1e3-7bd7-961c-8b14b479a718',
  })
  id: string;

  @ApiProperty({
    example: '018fb0ab-f1e3-7bd7-961c-8b14b479a710',
  })
  authId: string;

  @ApiProperty({
    example: 'Luffy',
    required: true,
  })
  name: string;

  @ApiProperty({
    example: 'https://image.com/avatars/luffy.png',
    required: false,
  })
  avatar: string;

  @ApiProperty({
    example: [Role.user],
    required: true,
  })
  roles: Role[];
}
