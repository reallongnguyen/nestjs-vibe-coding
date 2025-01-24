import { ApiProperty } from '@nestjs/swagger';

import { User } from '../../../domain/entities/user.entity';
import { Role } from '../../../domain/entities/role.enum';

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
    example: [Role.USER],
    required: true,
  })
  roles: Role[];

  @ApiProperty({
    example: true,
    required: true,
  })
  isActive: boolean;

  static fromApplication(applicationDto: User): UserDto {
    return {
      id: applicationDto.id,
      name: applicationDto.name,
      avatar: applicationDto.avatar,
      roles: applicationDto.roles,
      authId: applicationDto.authId,
      isActive: applicationDto.isActive,
    };
  }
}
