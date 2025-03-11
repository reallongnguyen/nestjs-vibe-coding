import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@liaoliaots/nestjs-redis';

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

const mockRedisService = {
  getClient: jest.fn(),
};

const mockEventBus = {
  publish: jest.fn(),
};

export const createTestingModule = async (
  imports: any[] = [],
  providers: any[] = [],
): Promise<TestingModule> => {
  return Test.createTestingModule({
    imports,
    providers: [
      {
        provide: Logger,
        useValue: mockLogger,
      },
      {
        provide: RedisService,
        useValue: mockRedisService,
      },
      {
        provide: 'EventBus',
        useValue: mockEventBus,
      },
      ...providers,
    ],
  }).compile();
};

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
