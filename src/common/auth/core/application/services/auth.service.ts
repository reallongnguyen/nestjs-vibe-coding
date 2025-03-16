import { Logger } from 'nestjs-pino';
import { Cache } from 'cache-manager';
import { AppError, createCommonError } from 'src/common/errors';

import { AuthCtx, shouldCache } from '../../domain/entities/auth-ctx.model';
import { AuthCtxRepoPort } from '../../ports/auth-ctx-repo.port';

const defaultTokenCacheTTL = 15 * 60 * 1000;
const maxTokenCacheTTL = 60 * 60 * 1000;

export class AuthService {
  private readonly logger: Logger;
  private readonly cacheManager: Cache;
  private readonly authCtxRepo: AuthCtxRepoPort;

  constructor(
    logger: Logger,
    cacheManager: Cache,
    authCtxRepo: AuthCtxRepoPort,
  ) {
    this.logger = logger;
    this.cacheManager = cacheManager;
    this.authCtxRepo = authCtxRepo;
  }

  async canActivate(request: any): Promise<boolean> {
    const authCtxId = this.authCtxRepo.getAuthCtxId(request);

    const authCtxKey = `authCtx:${authCtxId}`;

    try {
      // check if there is the cache data for this token
      const cachedAuthCtx = await this.cacheManager.get(authCtxKey);

      if (cachedAuthCtx) {
        request.authCtx = AuthCtx.fromJSObject(cachedAuthCtx);

        return true;
      }

      this.logger.verbose(
        'auth: authService: there is no cached authCtx => read token',
      );

      const authCtx = await this.authCtxRepo.getAuthCtx(request);

      if (shouldCache(authCtx)) {
        let ttl = defaultTokenCacheTTL;

        // Calculate time until token expiration if available
        if (authCtx.getExpireAt() && !Number.isNaN(authCtx.getExpireAt())) {
          ttl = authCtx.getExpireAt() * 1000 - Date.now();
        }

        // Clamp TTL between 0 and max cache time
        ttl = Math.max(0, Math.min(maxTokenCacheTTL, ttl));

        if (ttl > 0) {
          await this.cacheManager.set(authCtxKey, authCtx, ttl);
        }
      }

      request.authCtx = authCtx;

      return true;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }

      this.logger.error(`auth: authService: ${err.message}`);

      throw createCommonError('server.error');
    }
  }
}
