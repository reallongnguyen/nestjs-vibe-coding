import { Role } from '../../domain/entities/role.enum';
import { User } from '../../domain/entities/user.entity';

export class ProfileOutput implements Omit<User, 'createdAt' | 'updatedAt'> {
  id: string;
  authId: string;
  name: string;
  avatar: string;
  roles: Role[];
  isActive: boolean;

  static fromUser(u: User): ProfileOutput {
    const po = new ProfileOutput();
    po.id = u.id;
    po.authId = u.authId;
    po.name = u.name;
    po.avatar = u.avatar;
    po.roles = u.roles;
    po.isActive = u.isActive;

    return po;
  }
}
