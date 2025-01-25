import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { AuthService } from '../../../core/application/services/auth.service';
import { JwtAuthCtxRepo } from '../../infrastructure/repositories/jwt-auth-ctx.repo';

@Injectable()
export class JWTGuard implements CanActivate {
  private readonly authService: AuthService;

  constructor(
    logger: Logger,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    authCtxRepo: JwtAuthCtxRepo,
  ) {
    this.authService = new AuthService(logger, cacheManager, authCtxRepo);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.authService.canActivate(request);
  }
}
