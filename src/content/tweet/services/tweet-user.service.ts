import { Injectable, Logger, Inject } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GetUsersCommand } from '../../../feed/entities/commands/get-users.command';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

@Injectable()
export class TweetUserService {
  private readonly logger = new Logger(TweetUserService.name);
  private static readonly CACHE_TTL = 15 * 60; // 15 minutes in seconds
  private static readonly CACHE_KEY_PREFIX = 'tweet_user:';

  constructor(
    private readonly commandBus: CommandBus,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private getCacheKey(userId: string): string {
    return `${TweetUserService.CACHE_KEY_PREFIX}${userId}`;
  }

  async getUserData(userId: string): Promise<UserData | null> {
    try {
      // Try to get from cache first
      const cached = await this.cacheManager.get<UserData>(
        this.getCacheKey(userId),
      );
      if (cached) {
        return cached;
      }

      // Fetch from identity service
      const users = await this.commandBus.execute(
        new GetUsersCommand([userId]),
      );

      if (!users || users.length === 0) {
        return null;
      }

      const userData = users[0];

      // Cache the result
      await this.cacheManager.set(
        this.getCacheKey(userId),
        userData,
        TweetUserService.CACHE_TTL * 1000,
      );

      return userData;
    } catch (error) {
      this.logger.error(`Failed to fetch user data for ${userId}:`, error);
      return null;
    }
  }

  async getUsersData(userIds: string[]): Promise<Map<string, UserData>> {
    const result = new Map<string, UserData>();
    const uniqueIds = [...new Set(userIds)];

    try {
      // Try to get from cache first
      const cacheKeys = uniqueIds.map((id) => this.getCacheKey(id));
      const cachedData = await Promise.all(
        cacheKeys.map((key) => this.cacheManager.get<UserData>(key)),
      );

      // Collect missing user IDs
      const missingIds = uniqueIds.filter((id, index) => !cachedData[index]);

      if (missingIds.length > 0) {
        // Fetch missing users from identity service
        const users = await this.commandBus.execute(
          new GetUsersCommand(missingIds),
        );

        // Cache the results
        await Promise.all(
          users.map((user) =>
            this.cacheManager.set(
              this.getCacheKey(user.id),
              user,
              TweetUserService.CACHE_TTL * 1000,
            ),
          ),
        );

        // Add to result map
        users.forEach((user) => result.set(user.id, user));
      }

      // Add cached results to map
      uniqueIds.forEach((id, index) => {
        if (cachedData[index]) {
          result.set(id, cachedData[index]!);
        }
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch user data for multiple users:`, error);
      return result;
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    try {
      await this.cacheManager.del(this.getCacheKey(userId));
    } catch (error) {
      this.logger.error(
        `Failed to invalidate cache for user ${userId}:`,
        error,
      );
    }
  }
}
