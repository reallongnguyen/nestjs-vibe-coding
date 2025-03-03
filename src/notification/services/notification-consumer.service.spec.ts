import { Test, TestingModule } from '@nestjs/testing';
import { NotificationConsumerService } from './notification-consumer.service';

describe('NotificationService', () => {
  let service: NotificationConsumerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationConsumerService],
    }).compile();

    service = module.get<NotificationConsumerService>(
      NotificationConsumerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
