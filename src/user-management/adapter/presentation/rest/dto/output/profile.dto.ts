import { UserDto } from './user.dto';
import { ProfileOutput } from '../../../../../core/application/dto/output/profile.output';

export class ProfileDto extends UserDto {
  static fromApplication(applicationDto: ProfileOutput): ProfileDto {
    return {
      id: applicationDto.id,
      authId: applicationDto.authId,
      name: applicationDto.name,
      avatar: applicationDto.avatar,
      roles: applicationDto.roles,
      isActive: applicationDto.isActive,
    };
  }
}
