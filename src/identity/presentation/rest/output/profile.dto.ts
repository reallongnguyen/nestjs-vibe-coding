import { UserDto } from './user.dto';
import { ProfileOutput } from '../../../services/dto/profile.output';

export class ProfileDto extends UserDto {
  static fromApplication(applicationDto: ProfileOutput): ProfileDto {
    return {
      id: applicationDto.id,
      authId: applicationDto.authId,
      firstName: applicationDto.firstName,
      lastName: applicationDto.lastName,
      avatar: applicationDto.avatar,
      roles: applicationDto.roles,
      isActive: applicationDto.isActive,
      email: applicationDto.email,
      phone: applicationDto.phone,
      createdAt: applicationDto.createdAt,
      updatedAt: applicationDto.updatedAt,
    };
  }
}
