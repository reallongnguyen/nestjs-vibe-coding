import { UserDto } from './user.dto';
import { ProfileOutput } from '../../../domain/dto/output/profile.output';

export class ProfileDto extends UserDto {
  static fromApplication(applicationDto: ProfileOutput): ProfileDto {
    return {
      id: applicationDto.id,
      authId: applicationDto.authId,
      name: applicationDto.name,
      avatar: applicationDto.avatar,
      roles: applicationDto.roles,
    };
  }
}
