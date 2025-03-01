import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AppError } from 'src/common/models';

import { AuthCtx } from '../../../../core/domain/entities/auth-ctx.model';
import { User } from '../../../../core/domain/entities/user.entity';

export const AuthContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthCtx => {
    const request = ctx.switchToHttp().getRequest();

    const { authCtx } = request;

    if (!authCtx) {
      throw new AppError('common.invalidToken');
    }

    return authCtx;
  },
);

export const AuthContextUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();

    const { authCtx } = request;

    if (!authCtx) {
      throw new AppError('common.invalidToken');
    }

    if (!authCtx.isUser()) {
      throw new AppError('common.requireUser');
    }

    if (data && typeof data === 'string') {
      return authCtx.getUser()[data as keyof AuthCtx['user']];
    }

    return authCtx.getUser();
  },
);

export const OptionalAuthContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthCtx | undefined => {
    const request = ctx.switchToHttp().getRequest();

    const { authCtx } = request;

    return authCtx;
  },
);
