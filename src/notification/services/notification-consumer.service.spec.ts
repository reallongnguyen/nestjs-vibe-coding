import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationConsumerService } from './notification-consumer.service';
import { NotificationService } from './notification.service';
import { NotificationMetricsService } from './notification-metrics.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedlockMutex } from '../repositories/redlock.mutex';
import { NotificationPreferenceService } from './notification-preference.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationRateLimitService } from './notification-rate-limit.service';
import { NotificationCreateInput } from '../presentation/dtos/notification.dto';
import {
  NotificationType,
  NotificationChannel,
  NotificationPreference,
} from '../entities/notification-preference.entity';
import { Notification } from '../entities/notification.entity';

describe('NotificationConsumerService', () => {
  let service: NotificationConsumerService;
  let notificationService: jest.Mocked<NotificationService>;
  let metricsService: jest.Mocked<NotificationMetricsService>;
  let logger: jest.Mocked<Logger>;
  let configService: jest.Mocked<ConfigService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let prismaService: jest.Mocked<PrismaService>;
  let mutex: jest.Mocked<RedlockMutex>;
  let preferenceService: jest.Mocked<NotificationPreferenceService>;
  let templateService: jest.Mocked<NotificationTemplateService>;
  let rateLimitService: jest.Mocked<NotificationRateLimitService>;

  beforeEach(async () => {
    notificationService = {
      isRateLimitExceeded: jest.fn(),
    } as any;

    metricsService = {
      incrementCounter: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      verbose: jest.fn(),
    } as any;

    configService = {
      get: jest.fn().mockReturnValue(3600),
    } as any;

    eventEmitter = {
      emit: jest.fn(),
    } as any;

    prismaService = {
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        create: jest.fn().mockResolvedValue({
          id: '1',
          userId: '123',
          type: NotificationType.POST_LIKE,
          key: 'test-key',
          notificationTime: new Date(),
          viewedAt: null,
          link: 'test-link',
          metadata: {},
          subjects: [],
          subjectCount: 0,
          text: '',
          decorators: [],
        } as Notification),
      },
    } as any;

    mutex = {
      lock: jest
        .fn()
        .mockImplementation((_, callback) => callback({ aborted: false })),
    } as any;

    preferenceService = {
      getPreferenceByType: jest.fn(),
    } as any;

    templateService = {
      renderTemplate: jest.fn(),
    } as any;

    rateLimitService = {
      incrementRateLimitCounters: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationConsumerService,
        {
          provide: NotificationService,
          useValue: notificationService,
        },
        {
          provide: NotificationMetricsService,
          useValue: metricsService,
        },
        {
          provide: Logger,
          useValue: logger,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: EventEmitter2,
          useValue: eventEmitter,
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: RedlockMutex,
          useValue: mutex,
        },
        {
          provide: NotificationPreferenceService,
          useValue: preferenceService,
        },
        {
          provide: NotificationTemplateService,
          useValue: templateService,
        },
        {
          provide: NotificationRateLimitService,
          useValue: rateLimitService,
        },
      ],
    }).compile();

    service = module.get<NotificationConsumerService>(
      NotificationConsumerService,
    );
  });

  describe('upsertNotificationSerialByKey', () => {
    it('should create a new notification when no existing notification is found', async () => {
      const input: NotificationCreateInput = {
        userId: '123',
        type: NotificationType.POST_LIKE,
        key: 'test-key',
        link: 'test-link',
        metadata: {},
        subjects: [],
        subjectCount: 0,
      };

      const preference: NotificationPreference = {
        id: '1',
        userId: '123',
        type: NotificationType.POST_LIKE,
        enabled: true,
        channels: [NotificationChannel.IN_APP],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      preferenceService.getPreferenceByType.mockResolvedValue(preference);
      notificationService.isRateLimitExceeded.mockResolvedValue(false);
      templateService.renderTemplate.mockResolvedValue('rendered text');

      await service.upsertNotificationSerialByKey(input);

      expect(prismaService.notification.create).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'notification.created',
        expect.any(Object),
      );
      expect(rateLimitService.incrementRateLimitCounters).toHaveBeenCalledWith(
        input.userId,
        input.type,
      );
    });

    it('should skip notification creation when user is rate limited', async () => {
      const input: NotificationCreateInput = {
        userId: '123',
        type: NotificationType.POST_LIKE,
        key: 'test-key',
        link: 'test-link',
        metadata: {},
        subjects: [],
        subjectCount: 0,
      };

      notificationService.isRateLimitExceeded.mockResolvedValue(true);

      await service.upsertNotificationSerialByKey(input);

      expect(prismaService.notification.create).not.toHaveBeenCalled();
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        input.type,
        'rate_limited',
      );
    });

    it('should skip notification creation when notifications are disabled', async () => {
      const input: NotificationCreateInput = {
        userId: '123',
        type: NotificationType.POST_LIKE,
        key: 'test-key',
        link: 'test-link',
        metadata: {},
        subjects: [],
        subjectCount: 0,
      };

      const preference: NotificationPreference = {
        id: '1',
        userId: '123',
        type: NotificationType.POST_LIKE,
        enabled: false,
        channels: [NotificationChannel.IN_APP],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      notificationService.isRateLimitExceeded.mockResolvedValue(false);
      preferenceService.getPreferenceByType.mockResolvedValue(preference);

      await service.upsertNotificationSerialByKey(input);

      expect(prismaService.notification.create).not.toHaveBeenCalled();
      expect(metricsService.incrementCounter).toHaveBeenCalledWith(
        input.type,
        'skipped',
      );
    });
  });
});
