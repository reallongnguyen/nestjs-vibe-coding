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
import { JwtAuthContextRepo } from '../../infrastructure/repositories/jwt-auth-ctx.repo';

@Injectable()
export class JWTGuard implements CanActivate {
  private readonly authService: AuthUsecase;

  constructor(
    private readonly jwtAuthContextRepo: JwtAuthContextRepo,
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.authService = new AuthUsecase(
      this.logger,
      this.cacheManager,
      this.jwtAuthContextRepo,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.authService.canActivate(request);
  }
}
