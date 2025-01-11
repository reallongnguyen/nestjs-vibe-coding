import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../../core/domain/entities/role.enum';

export const ROLES_KEY = 'requireAnyRoles';
export const RequireAnyRoles = (...roles: Role[]) =>
  SetMetadata(ROLES_KEY, roles);
