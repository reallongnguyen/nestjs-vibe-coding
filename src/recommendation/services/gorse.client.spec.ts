import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@liaoliaots/nestjs-redis';
import axios from 'axios';
import { GorseClient } from './gorse.client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GorseClient', () => {
  let client: GorseClient;

  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'recommendation.gorse.url':
                  return 'http://localhost:8088';
                case 'recommendation.gorse.apiKey':
                  return 'test-api-key';
                case 'recommendation.gorse.feedbackBatchSize':
                  return 100;
                case 'recommendation.gorse.feedbackFlushIntervalMs':
                  return 8000;
                default:
                  return undefined;
              }
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getOrThrow: jest.fn(() => ({
              set: jest.fn(),
              get: jest.fn(),
              del: jest.fn(),
              expire: jest.fn(),
              ttl: jest.fn(),
              lpush: jest.fn(),
              rpop: jest.fn(),
              llen: jest.fn(),
            })),
          },
        },
        GorseClient,
      ],
    }).compile();

    client = module.get<GorseClient>(GorseClient);
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  // Test user management
  describe('User Management', () => {
    it('should insert a user', async () => {
      const userId = 'test-user';
      const labels = ['label1', 'label2'];
      const subscribe = ['topic1'];

      mockAxiosInstance.post.mockResolvedValueOnce({});

      await client.insertUser(userId, labels, subscribe);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/user', {
        UserId: userId,
        Labels: labels,
        Subscribe: subscribe,
      });
    });
  });
});
