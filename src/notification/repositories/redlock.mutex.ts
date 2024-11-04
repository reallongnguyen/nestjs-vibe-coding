import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redlock, { RedlockAbortSignal } from 'redlock';
import Client, { RedisOptions } from 'ioredis';
import { isEqual } from 'lodash';
import { Mutex } from '../usecases/interfaces/mutex.interface';

@Injectable()
export class RedlockMutex implements Mutex {
  private redlock: Redlock;
  lockDuration = 5000;

  constructor(private config: ConfigService) {
    const redis1Cfg = config.get<RedisOptions>('mutex.redis1');
    const redis2Cfg = config.get<RedisOptions>('mutex.redis2');
    const redis3Cfg = config.get<RedisOptions>('mutex.redis3');

    const redisClients: Client[] = [];

    const redis1 = new Client(redis1Cfg);
    redisClients.push(redis1);

    if (!isEqual(redis1Cfg, redis2Cfg) && !isEqual(redis2Cfg, redis3Cfg)) {
      const redis2 = new Client(redis2Cfg);
      redisClients.push(redis2);

      const redis3 = new Client(redis3Cfg);
      redisClients.push(redis3);
    }

    this.redlock = new Redlock(redisClients, {
      // The expected clock drift; for more details see:
      // http://redis.io/topics/distlock
      driftFactor: 0.01, // multiplied by lock ttl to determine drift time

      // The max number of times Redlock will attempt to lock a resource
      // before erroring.
      retryCount: 0,

      // the time in ms between attempts
      retryDelay: 200, // time in ms

      // the max time in ms randomly added to retries
      // to improve performance under high contention
      // see https://www.awsarchitectureblog.com/2015/03/backoff.html
      retryJitter: 200, // time in ms

      // The minimum remaining time on a lock before an extension is automatically
      // attempted with the `using` API.
      automaticExtensionThreshold: 500, // time in ms
    });
  }

  async lock<T>(
    keys: string[],
    cb: (signal: RedlockAbortSignal) => Promise<T>,
  ) {
    return this.redlock.using<T>(keys, this.lockDuration, cb);
  }
}
