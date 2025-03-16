import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createCommonError } from 'src/common/errors';
import { Role } from '../../../core/domain/entities/role.enum';
import { ROLES_KEY } from './decorators/require-any-roles.decorator';

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

    const { authCtx } = context.switchToHttp().getRequest();

    if (!authCtx) {
      throw createCommonError('auth.invalid-token');
    }

    if (!authCtx.isUser()) {
      throw createCommonError('auth.require-user');
    }

    if (requiredRoles.find((role) => authCtx.getUser().roles.includes(role))) {
      return true;
    }

    throw createCommonError('auth.no-privilege', {
      roles: requiredRoles.join(', '),
    });
  }
}
