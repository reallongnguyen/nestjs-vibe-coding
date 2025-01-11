import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from 'src/common/models/AppError';
import { Role } from '../../../core/domain/entities/role.enum';
import { ROLES_KEY } from './decorators/require-any-roles.decorator';
import { AuthCtx } from '../../../core/domain/entities/auth-ctx.model';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { authContext } = context.switchToHttp().getRequest();
    const authCtx = authContext as AuthCtx;

    if (!authCtx || !Array.isArray(authCtx.roles)) {
      throw new AppError('common.invalidToken');
    }

    if (requiredRoles.find((role) => authCtx.roles.includes(role))) {
      return true;
    }

    throw new AppError('common.noPrivilege', {
      roles: requiredRoles.join(', '),
    });
  }
}
