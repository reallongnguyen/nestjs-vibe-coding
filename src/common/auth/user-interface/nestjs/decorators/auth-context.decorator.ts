import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthContextInfo } from '../../../domain/models/auth-context-info.model';

export const AuthContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthContextInfo => {
    const request = ctx.switchToHttp().getRequest();

    return request.authContext;
  },
);
