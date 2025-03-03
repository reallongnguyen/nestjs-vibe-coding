import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { of } from 'rxjs';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationPreferenceService } from './notification-preference.service';
import {
  NotificationChannel,
  NotificationType,
} from '../entities/notification-preference.entity';
import {
  NotificationDeliveryAttemptEvent,
  NotificationDeliverySuccessEvent,
  NotificationDeliveryFailureEvent,
} from '../entities/events';

describe('NotificationDeliveryService', () => {
  let service: NotificationDeliveryService;
  let mockLogger: jest.Mocked<Logger>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockPreferenceService: jest.Mocked<NotificationPreferenceService>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockMqttClient: jest.Mocked<ClientProxy>;

  const mockNotification = {
    id: 'notification-id-1',
    key: 'notification-key-1',
    userId: 'user-id-1',
    type: NotificationType.POST_LIKE,
    subjects: [{ id: 'subject-1', name: 'Subject 1', type: 'user' }],
    subjectCount: 1,
    diObject: { id: 'object-1', name: 'Object 1', type: 'post' },
    inObject: null,
    prObject: null,
    text: 'Test notification',
    decorators: [],
    link: 'https://example.com/test',
    notificationTime: new Date(),
    viewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: null,
  };

  const mockPreference = {
    id: 'preference-id-1',
    userId: 'user-id-1',
    type: NotificationType.POST_LIKE,
    channels: [NotificationChannel.IN_APP],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    mockConfigService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    mockPreferenceService = {
      getPreferenceByType: jest.fn(),
    } as unknown as jest.Mocked<NotificationPreferenceService>;

    mockEventEmitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    mockMqttClient = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<ClientProxy>;

    // Set up default config values
    mockConfigService.get.mockImplementation((key, defaultValue) => {
      if (key === 'notification.deliveryTimeout') return 5000;
      if (key === 'notification.maxDeliveryRetries') return 3;
      if (key === 'notification.retryDelayMs') return 1000;
      return defaultValue;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationDeliveryService,
        {
          provide: Logger,
          useValue: mockLogger,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: NotificationPreferenceService,
          useValue: mockPreferenceService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: 'notification_mqtt_client',
          useValue: mockMqttClient,
        },
      ],
    }).compile();

    service = module.get<NotificationDeliveryService>(
      NotificationDeliveryService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deliverNotification', () => {
    it('should skip delivery if notifications are disabled', async () => {
      // Mock preference with disabled notifications
      mockPreferenceService.getPreferenceByType.mockResolvedValue({
        ...mockPreference,
        enabled: false,
      });

      const result = await service.deliverNotification(mockNotification);

      expect(result).toBe(true);
      expect(mockPreferenceService.getPreferenceByType).toHaveBeenCalledWith(
        mockNotification.userId,
        mockNotification.type,
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('skipped - user'),
      );
      expect(mockMqttClient.emit).not.toHaveBeenCalled();
    });

    it('should deliver notification to enabled channels', async () => {
      // Mock preference with enabled notifications
      mockPreferenceService.getPreferenceByType.mockResolvedValue(
        mockPreference,
      );

      // Mock successful MQTT delivery
      mockMqttClient.emit.mockImplementation(() => of({}));

      const result = await service.deliverNotification(mockNotification);

      expect(result).toBe(true);
      expect(mockPreferenceService.getPreferenceByType).toHaveBeenCalledWith(
        mockNotification.userId,
        mockNotification.type,
      );
      expect(mockMqttClient.emit).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        NotificationDeliveryAttemptEvent.EVENT_NAME,
        expect.any(NotificationDeliveryAttemptEvent),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        NotificationDeliverySuccessEvent.EVENT_NAME,
        expect.any(NotificationDeliverySuccessEvent),
      );
    });

    it('should handle delivery errors gracefully', async () => {
      // Mock preference with enabled notifications
      mockPreferenceService.getPreferenceByType.mockResolvedValue(
        mockPreference,
      );

      // Mock failed MQTT delivery
      mockMqttClient.emit.mockImplementation(() => {
        throw new Error('MQTT connection error');
      });

      const result = await service.deliverNotification(mockNotification);

      expect(result).toBe(false);
      expect(mockPreferenceService.getPreferenceByType).toHaveBeenCalledWith(
        mockNotification.userId,
        mockNotification.type,
      );
      expect(mockMqttClient.emit).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        NotificationDeliveryAttemptEvent.EVENT_NAME,
        expect.any(NotificationDeliveryAttemptEvent),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        NotificationDeliveryFailureEvent.EVENT_NAME,
        expect.any(NotificationDeliveryFailureEvent),
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('processChannelDelivery', () => {
    it('should process delivery for supported channels', async () => {
      // Mock successful MQTT delivery
      mockMqttClient.emit.mockImplementation(() => of({}));

      // Use private method through any cast
      const result = await (service as any).processChannelDelivery(
        NotificationChannel.IN_APP,
        mockNotification,
      );

      expect(result).toEqual({
        channel: NotificationChannel.IN_APP,
        success: true,
      });
      expect(mockMqttClient.emit).toHaveBeenCalled();
    });

    it('should handle unsupported channels', async () => {
      // Use private method through any cast
      const result = await (service as any).processChannelDelivery(
        'unsupported_channel',
        mockNotification,
      );

      expect(result).toEqual({
        channel: 'unsupported_channel',
        success: false,
      });
      expect(mockMqttClient.emit).not.toHaveBeenCalled();
    });
  });
});
