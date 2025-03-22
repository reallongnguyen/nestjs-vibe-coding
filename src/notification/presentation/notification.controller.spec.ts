import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard, PagedResult, User } from 'src/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from '../services/notification.service';
import {
  NotificationRateLimitService,
  RateLimitStatus,
} from '../services/notification-rate-limit.service';
import {
  NotificationListQuery,
  NotificationOutput,
  NotificationPatchQuery,
} from './dtos/notification.dto';
import {
  NotificationType,
  RateLimitQuery,
} from '../entities/notification-preference.entity';

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: jest.Mocked<NotificationService>;
  let rateLimitService: jest.Mocked<NotificationRateLimitService>;

  const mockUser: User = {
    id: 'test-user',
    authId: 'auth-id',
    email: 'test@example.com',
    phone: '1234567890',
    firstName: 'Test',
    lastName: 'User',
    avatar: 'avatar.jpg',
    roles: ['USER'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockNotificationService = {
      getNotificationsForUser: jest.fn(),
      view: jest.fn(),
      getUnreadCount: jest.fn(),
    };

    const mockRateLimitService = {
      getRateLimitStatus: jest.fn(),
      overrideRateLimit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: NotificationRateLimitService,
          useValue: mockRateLimitService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationController>(NotificationController);
    notificationService = module.get(NotificationService);
    rateLimitService = module.get(NotificationRateLimitService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get notifications for user', async () => {
    const query = new NotificationListQuery();
    query.pageSize = 10;
    query.pageNumber = 0;
    query.includeViewed = false;

    const notifications = new PagedResult<NotificationOutput>(
      [
        {
          id: '1',
          text: 'test',
          decorators: [],
          link: '/test',
          notificationTime: new Date(),
          viewedAt: null,
        },
      ],
      {
        pageSize: 10,
        pageNumber: 0,
        totalItems: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    );

    notificationService.getNotificationsForUser.mockResolvedValue(
      notifications,
    );

    const result = await controller.list(mockUser, query);

    expect(notificationService.getNotificationsForUser).toHaveBeenCalledWith(
      mockUser.id,
      query.pageSize,
      query.pageNumber * query.pageSize,
      query.includeViewed,
    );
    expect(result).toBe(notifications);
  });

  it('should mark notification as viewed', async () => {
    const query: NotificationPatchQuery = {
      id: 'test-notification',
    };

    await controller.view(mockUser, query);

    expect(notificationService.view).toHaveBeenCalledWith(
      mockUser.id,
      query.id,
    );
  });

  it('should get unread count', async () => {
    const count = 5;

    notificationService.getUnreadCount.mockResolvedValue(count);

    const result = await controller.getUnreadCount(mockUser);

    expect(notificationService.getUnreadCount).toHaveBeenCalledWith(
      mockUser.id,
    );
    expect(result).toEqual({ count });
  });

  it('should get rate limit status', async () => {
    const query: RateLimitQuery = {
      type: NotificationType.POST_LIKE,
    };
    const status: RateLimitStatus = {
      limits: {
        perMinute: 10,
        perHour: 50,
        perDay: 200,
      },
      current: {
        minute: 5,
        hour: 25,
        day: 100,
      },
      remaining: {
        minute: 5,
        hour: 25,
        day: 100,
      },
      isRateLimited: false,
    };

    rateLimitService.getRateLimitStatus.mockResolvedValue(status);

    const result = await controller.getRateLimits(mockUser, query);

    expect(rateLimitService.getRateLimitStatus).toHaveBeenCalledWith(
      mockUser.id,
      query.type,
    );
    expect(result).toBe(status);
  });

  it('should override rate limit', async () => {
    const query: RateLimitQuery = {
      type: NotificationType.POST_LIKE,
    };

    await controller.overrideRateLimits(mockUser, query);

    expect(rateLimitService.overrideRateLimit).toHaveBeenCalledWith(
      mockUser.id,
      query.type,
    );
  });
});
