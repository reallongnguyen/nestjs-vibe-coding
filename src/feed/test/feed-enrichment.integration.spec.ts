import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, CqrsModule } from '@nestjs/cqrs';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { FeedEnrichmentService } from '../services/feed-enrichment.service';
import { GetContentsCommand } from '../entities/commands/get-contents.command';
import { GetUsersCommand } from '../entities/commands/get-users.command';
import { GetEngagementMetricsCommand } from '../entities/commands/get-engagement-metrics.command';
import { GetUserLikesStatusCommand } from '../entities/commands/get-user-likes-status.command';
import { GetUserFollowStatusCommand } from '../entities/commands/get-user-follow-status.command';
import { CacheModule } from '../../common/cache/cache.module';

// Mock handlers
class GetContentsHandler {
  async execute(command: GetContentsCommand) {
    const { contentIds } = command;
    return contentIds.map((id) => ({
      id,
      type: 'article',
      title: `Article ${id}`,
      content: `Content of article ${id}`,
      authorId: `user-${id.split('-')[1]}`,
      score: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
}

class GetUsersHandler {
  async execute(command: GetUsersCommand) {
    const { userIds } = command;
    return userIds.map((id) => ({
      id,
      firstName: `FirstName-${id}`,
      lastName: `LastName-${id}`,
      avatarUrl: id === 'user-1' ? 'http://example.com/avatar.jpg' : null,
    }));
  }
}

class GetEngagementMetricsHandler {
  async execute(command: GetEngagementMetricsCommand) {
    const { contentIds } = command;
    return contentIds.map((id) => ({
      contentId: id,
      likeCount: parseInt(id.split('-')[1], 10) * 10,
      commentCount: parseInt(id.split('-')[1], 10) * 5,
      viewCount: parseInt(id.split('-')[1], 10) * 100,
    }));
  }
}

class GetUserLikesStatusHandler {
  async execute(command: GetUserLikesStatusCommand) {
    const { contentIds } = command;
    return contentIds.map((id) => ({
      contentId: id,
      liked: id === 'content-1', // Only like content-1
    }));
  }
}

class GetUserFollowStatusHandler {
  async execute(command: GetUserFollowStatusCommand) {
    const { targetUserIds } = command;
    return targetUserIds.map((id) => ({
      targetUserId: id,
      following: id === 'user-1', // Only follow user-1
    }));
  }
}

describe('FeedEnrichmentService Integration', () => {
  let service: FeedEnrichmentService;
  let commandBus: CommandBus;

  beforeAll(async () => {
    // Create a testing module with real services and mock handlers
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CqrsModule,
        LoggerModule.forRoot(),
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              cache: {
                ttl: 60, // 1 minute default TTL for tests
              },
              redis: {
                host: 'localhost',
                port: 6379,
              },
            }),
          ],
        }),
        RedisModule.forRootAsync({
          useFactory: () => ({
            config: {
              host: 'localhost',
              port: 6379,
            },
          }),
        }),
        CacheModule,
      ],
      providers: [
        FeedEnrichmentService,
        {
          provide: GetContentsHandler,
          useClass: GetContentsHandler,
        },
        {
          provide: GetUsersHandler,
          useClass: GetUsersHandler,
        },
        {
          provide: GetEngagementMetricsHandler,
          useClass: GetEngagementMetricsHandler,
        },
        {
          provide: GetUserLikesStatusHandler,
          useClass: GetUserLikesStatusHandler,
        },
        {
          provide: GetUserFollowStatusHandler,
          useClass: GetUserFollowStatusHandler,
        },
      ],
    }).compile();

    service = module.get<FeedEnrichmentService>(FeedEnrichmentService);
    commandBus = module.get<CommandBus>(CommandBus);

    // Register command handlers
    const getContentsHandler =
      module.get<GetContentsHandler>(GetContentsHandler);
    const getUsersHandler = module.get<GetUsersHandler>(GetUsersHandler);
    const getEngagementMetricsHandler = module.get<GetEngagementMetricsHandler>(
      GetEngagementMetricsHandler,
    );
    const getUserLikesStatusHandler = module.get<GetUserLikesStatusHandler>(
      GetUserLikesStatusHandler,
    );
    const getUserFollowStatusHandler = module.get<GetUserFollowStatusHandler>(
      GetUserFollowStatusHandler,
    );

    // Mock the command handlers
    jest.spyOn(commandBus, 'execute').mockImplementation(async (command) => {
      if (command instanceof GetContentsCommand) {
        return getContentsHandler.execute(command);
      }
      if (command instanceof GetUsersCommand) {
        return getUsersHandler.execute(command);
      }
      if (command instanceof GetEngagementMetricsCommand) {
        return getEngagementMetricsHandler.execute(command);
      }
      if (command instanceof GetUserLikesStatusCommand) {
        return getUserLikesStatusHandler.execute(command);
      }
      if (command instanceof GetUserFollowStatusCommand) {
        return getUserFollowStatusHandler.execute(command);
      }
      throw new Error(`No handler for command ${command.constructor.name}`);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enrichFeedItems', () => {
    it('should enrich feed items with all available data when user is logged in', async () => {
      // Test with a logged-in user
      const result = await service.enrichFeedItems(
        ['content-1', 'content-2'],
        'test-user',
      );

      // Verify the results
      expect(result).toHaveLength(2);

      // Check first item
      expect(result[0].id).toBe('content-1');
      expect(result[0].author).toBeDefined();
      expect(result[0].author!.firstName).toBe('FirstName-user-1');
      expect(result[0].engagement).toBeDefined();
      expect(result[0].engagement!.likeCount).toBe(10);
      expect(result[0].userSpecific).toBeDefined();
      expect(result[0].userSpecific!.liked).toBe(true);
      expect(result[0].userSpecific!.following).toBe(true);

      // Check second item
      expect(result[1].id).toBe('content-2');
      expect(result[1].author).toBeDefined();
      expect(result[1].author!.firstName).toBe('FirstName-user-2');
      expect(result[1].engagement).toBeDefined();
      expect(result[1].engagement!.likeCount).toBe(20);
      expect(result[1].userSpecific).toBeDefined();
      expect(result[1].userSpecific!.liked).toBe(false);
      expect(result[1].userSpecific!.following).toBe(false);
    });

    it('should enrich feed items without user-specific data when user is not logged in', async () => {
      // Test without a logged-in user
      const result = await service.enrichFeedItems(['content-1', 'content-2']);

      // Verify the results
      expect(result).toHaveLength(2);

      // Check first item
      expect(result[0].id).toBe('content-1');
      expect(result[0].author).toBeDefined();
      expect(result[0].author!.firstName).toBe('FirstName-user-1');
      expect(result[0].engagement).toBeDefined();
      expect(result[0].engagement!.likeCount).toBe(10);
      expect(result[0].userSpecific).toBeUndefined();

      // Check second item
      expect(result[1].id).toBe('content-2');
      expect(result[1].author).toBeDefined();
      expect(result[1].engagement).toBeDefined();
      expect(result[1].userSpecific).toBeUndefined();
    });

    it('should handle larger batches of data efficiently', async () => {
      // Create a larger batch of content IDs
      const contentIds = Array.from(
        { length: 20 },
        (_, i) => `content-${i + 1}`,
      );

      // Measure execution time
      const startTime = performance.now();
      const result = await service.enrichFeedItems(contentIds, 'test-user');
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Verify the results
      expect(result).toHaveLength(20);
      expect(result[0].author).toBeDefined();
      expect(result[0].engagement).toBeDefined();
      expect(result[0].userSpecific).toBeDefined();

      // Performance expectation - this is a very rough guideline and should be adjusted based on environment
      // Log removed to avoid linter warnings, but we still verify performance
      expect(executionTime).toBeLessThan(500); // 500ms for 20 items (arbitrary)
    });
  });
});
