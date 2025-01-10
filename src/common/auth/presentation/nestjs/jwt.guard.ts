import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from 'nestjs-pino';
import { Cache } from 'cache-manager';

import { AuthUsecase } from '../../domain/usecases/auth.usecase';
import { JwtAuthCtxRepo } from '../../infrastructure/repositories/jwt-auth-ctx.repo';

@Injectable()
export class JWTGuard implements CanActivate {
  private readonly authUsecase: AuthUsecase;

  constructor(
    private readonly jwtAuthCtxRepo: JwtAuthCtxRepo,
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.authUsecase = new AuthUsecase(
      this.logger,
      this.cacheManager,
      this.jwtAuthCtxRepo,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.authUsecase.canActivate(request);
  }
}
