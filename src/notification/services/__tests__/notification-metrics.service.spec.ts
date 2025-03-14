import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { MetricsService } from 'src/common/monitoring/metrics.service';
import { NotificationMetricsService } from '../notification-metrics.service';

describe('NotificationMetricsService', () => {
  let service: NotificationMetricsService;
  let metricsService: MetricsService;
  let logger: Logger;

  const mockMetricsService = {
    registerHistogram: jest.fn(),
    registerCounter: jest.fn(),
    registerGauge: jest.fn(),
    getMetric: jest.fn(),
  };

  const mockLogger = {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationMetricsService,
        { provide: MetricsService, useValue: mockMetricsService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<NotificationMetricsService>(
      NotificationMetricsService,
    );
    metricsService = module.get<MetricsService>(MetricsService);
    logger = module.get<Logger>(Logger);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should register metrics with Prometheus', async () => {
      await service.onModuleInit();

      expect(metricsService.registerHistogram).toHaveBeenCalledWith({
        name: 'notification_processing_duration',
        help: 'Notification processing duration in seconds',
        labelNames: ['type', 'stage'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      });

      expect(metricsService.registerCounter).toHaveBeenCalledWith({
        name: 'notification_processed',
        help: 'Total notifications processed',
        labelNames: ['type', 'status'],
      });

      expect(metricsService.registerGauge).toHaveBeenCalledWith({
        name: 'notification_queue_length',
        help: 'Current notification queue length',
        labelNames: ['queue'],
      });

      expect(metricsService.registerCounter).toHaveBeenCalledWith({
        name: 'notification_delivery_attempts',
        help: 'Total notification delivery attempts',
        labelNames: ['channel', 'status'],
      });

      expect(logger.debug).toHaveBeenCalledWith(
        'Registering notification metrics with Prometheus',
      );
      expect(logger.debug).toHaveBeenCalledWith(
        'Notification metrics registered successfully',
      );
    });
  });

  describe('startTimer', () => {
    it('should return a timer object', () => {
      const mockHistogram = {
        observe: jest.fn(),
      };

      mockMetricsService.getMetric.mockReturnValue(mockHistogram);

      const timer = service.startTimer('like', 'producer');
      expect(timer).toBeDefined();
      expect(typeof timer.end).toBe('function');
    });

    it('should log warning if histogram is not found', () => {
      mockMetricsService.getMetric.mockReturnValue(null);

      const timer = service.startTimer('like', 'producer');
      expect(timer).toBeDefined();
      expect(typeof timer.end).toBe('function');
      expect(logger.warn).toHaveBeenCalledWith(
        'Histogram metric not found: notification_processing_duration',
      );
    });

    it('should observe duration when timer ends', () => {
      const mockHistogram = {
        observe: jest.fn(),
      };

      mockMetricsService.getMetric.mockReturnValue(mockHistogram);

      const timer = service.startTimer('like', 'producer');
      timer.end();

      expect(mockHistogram.observe).toHaveBeenCalled();
      // We can't test the exact duration since it depends on process.hrtime
      expect(mockHistogram.observe.mock.calls[0][0]).toEqual({
        type: 'like',
        stage: 'producer',
      });
    });
  });

  describe('incrementCounter', () => {
    it('should increment counter with labels', () => {
      const mockCounter = {
        inc: jest.fn(),
      };

      mockMetricsService.getMetric.mockReturnValue(mockCounter);

      service.incrementCounter('like', 'success');

      expect(mockCounter.inc).toHaveBeenCalledWith({
        type: 'like',
        status: 'success',
      });
    });

    it('should log warning if counter is not found', () => {
      mockMetricsService.getMetric.mockReturnValue(null);

      service.incrementCounter('like', 'success');

      expect(logger.warn).toHaveBeenCalledWith(
        'Counter metric not found: notification_processed',
      );
    });
  });

  describe('setQueueLength', () => {
    it('should set gauge with labels', () => {
      const mockGauge = {
        set: jest.fn(),
      };

      mockMetricsService.getMetric.mockReturnValue(mockGauge);

      service.setQueueLength('producer', 10);

      expect(mockGauge.set).toHaveBeenCalledWith({ queue: 'producer' }, 10);
    });

    it('should log warning if gauge is not found', () => {
      mockMetricsService.getMetric.mockReturnValue(null);

      service.setQueueLength('producer', 10);

      expect(logger.warn).toHaveBeenCalledWith(
        'Gauge metric not found: notification_queue_length',
      );
    });
  });

  describe('incrementDeliveryCounter', () => {
    it('should increment counter with labels', () => {
      const mockCounter = {
        inc: jest.fn(),
      };

      mockMetricsService.getMetric.mockReturnValue(mockCounter);

      service.incrementDeliveryCounter('mqtt', 'success');

      expect(mockCounter.inc).toHaveBeenCalledWith({
        channel: 'mqtt',
        status: 'success',
      });
    });

    it('should log warning if counter is not found', () => {
      mockMetricsService.getMetric.mockReturnValue(null);

      service.incrementDeliveryCounter('mqtt', 'success');

      expect(logger.warn).toHaveBeenCalledWith(
        'Counter metric not found: notification_delivery_attempts',
      );
    });
  });
});
