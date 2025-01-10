import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthCtx } from '../../../domain/models/auth-ctx.model';

export const AuthContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthCtx => {
    const request = ctx.switchToHttp().getRequest();

    return request.authContext;
  },
);
