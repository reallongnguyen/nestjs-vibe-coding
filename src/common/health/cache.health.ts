import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';

export interface Dog {
  name: string;
  type: string;
}

@Injectable()
export class CacheHealthIndicator extends HealthIndicator {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.cacheManager.get('health');

      const result = this.getStatus(key, true);

      return result;
    } catch (err) {
      throw new HealthCheckError(
        'Cache check failed',
        this.getStatus(key, false, { error: err.message }),
      );
    }
  }
}
