import { Logger } from 'nestjs-pino';
import { Cache } from 'cache-manager';
import { AppError } from 'src/common/models';
import { shouldCache } from '../models/auth-ctx.model';
import { AuthCtxRepo } from '../ports/auth-ctx-repo.port';

const defaultTokenCacheTTL = 15 * 60 * 1000;
const maxTokenCacheTTL = 60 * 60 * 1000;

export class AuthUsecase {
  constructor(
    private readonly logger: Logger,
    private readonly cacheManager: Cache,
    private readonly authCtxRepo: AuthCtxRepo,
  ) {}

  async canActivate(request: any): Promise<boolean> {
    const authCtxId = this.authCtxRepo.getAuthCtxId(request);

    const authCtxKey = `authCtx:${authCtxId}`;

    try {
      // check if there is the cache data for this token
      const cachedAuthCtx = await this.cacheManager.get(authCtxKey);

      if (cachedAuthCtx) {
        request.authContext = cachedAuthCtx;

        return true;
      }

      this.logger.verbose(
        'auth: authUsecase: there is no cached authCtx => verify token',
      );

      const authCtx = await this.authCtxRepo.getAuthCtx(request);

      if (shouldCache(authCtx)) {
        let ttl = defaultTokenCacheTTL;

        // Calculate time until token expiration if available
        if (authCtx.expireAt && !Number.isNaN(authCtx.expireAt)) {
          ttl = authCtx.expireAt * 1000 - Date.now();
        }

        // Clamp TTL between 0 and max cache time
        ttl = Math.max(0, Math.min(maxTokenCacheTTL, ttl));

        if (ttl > 0) {
          await this.cacheManager.set(authCtxKey, authCtx, ttl);
        }
      }

      request.authContext = authCtx;

      return true;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }

      this.logger.error(`auth: authUsecase: ${err.message}`);

      throw new AppError('common.serverError');
    }
  }
}
