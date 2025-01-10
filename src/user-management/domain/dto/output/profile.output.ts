import { Role } from '../../models/role.model';
import { User } from '../../models/user.entity';

export class ProfileOutput implements Omit<User, 'createdAt' | 'updatedAt'> {
  id: string;
  authId: string;
  name: string;
  avatar: string;
  roles: Role[];

  static fromUser(u: User): ProfileOutput {
    const po = new ProfileOutput();
    po.id = u.id;
    po.authId = u.authId;
    po.name = u.name;
    po.avatar = u.avatar;
    po.roles = u.roles;
    return po;
  }
}
