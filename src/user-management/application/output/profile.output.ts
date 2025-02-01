import { Role } from '../../domain/entities/role.enum';
import { User } from '../../domain/entities/user.entity';

export class ProfileOutput implements User {
  id: string;
  authId: string;
  firstName: string;
  lastName: string | null;
  avatar: string | null;
  roles: Role[];
  isActive: boolean;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;

  static fromUser(u: User): ProfileOutput {
    const po = new ProfileOutput();
    po.id = u.id;
    po.authId = u.authId;
    po.firstName = u.firstName;
    po.lastName = u.lastName;
    po.avatar = u.avatar;
    po.roles = u.roles;
    po.isActive = u.isActive;
    po.email = u.email;
    po.phone = u.phone;
    po.createdAt = u.createdAt;
    po.updatedAt = u.updatedAt;

    return po;
  }
}
