import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GorseClient } from './gorse.client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GorseClient', () => {
  let client: GorseClient;
  let configService: jest.Mocked<ConfigService>;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GorseClient,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    client = module.get<GorseClient>(GorseClient);
    configService = module.get(ConfigService);

    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'GORSE_API_ENDPOINT':
          return 'http://localhost:8088';
        case 'GORSE_API_KEY':
          return 'test-api-key';
        default:
          return undefined;
      }
    });

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  it('should throw error if config is missing', () => {
    mockConfigService.get.mockReturnValue(undefined);

    const createClient = () => new GorseClient(configService);
    expect(createClient).toThrow('Missing required Gorse configuration');
  });

  describe('User Management', () => {
    it('should insert user', async () => {
      const userId = 'user1';
      const labels = ['label1'];
      const subscribe = ['sub1'];

      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      await client.insertUser(userId, labels, subscribe);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/user', {
        UserId: userId,
        Labels: labels,
        Subscribe: subscribe,
      });
    });

    it('should get user', async () => {
      const userId = 'user1';
      const mockUser = { UserId: userId, Labels: ['label1'] };

      mockAxiosInstance.get.mockResolvedValue({ data: mockUser });

      const result = await client.getUser(userId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/api/user/${userId}`);
      expect(result).toEqual(mockUser);
    });

    it('should update user', async () => {
      const userId = 'user1';
      const labels = ['label1'];
      const subscribe = ['sub1'];

      mockAxiosInstance.patch.mockResolvedValue({ data: {} });

      await client.updateUser(userId, labels, subscribe);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        `/api/user/${userId}`,
        {
          Labels: labels,
          Subscribe: subscribe,
        },
      );
    });

    it('should delete user', async () => {
      const userId = 'user1';

      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await client.deleteUser(userId);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        `/api/user/${userId}`,
      );
    });

    it('should list users', async () => {
      const mockResponse = {
        Cursor: 'next-cursor',
        Users: [{ UserId: 'user1' }, { UserId: 'user2' }],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      const result = await client.listUsers(10, 'current-cursor');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/users?n=10&cursor=current-cursor',
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Item Management', () => {
    it('should insert item', async () => {
      const itemId = 'item1';
      const timestamp = new Date();
      const labels = ['label1'];
      const categories = ['cat1'];
      const isHidden = false;

      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      await client.insertItem(itemId, timestamp, labels, categories, isHidden);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/item', {
        ItemId: itemId,
        Labels: labels,
        Categories: categories,
        Timestamp: timestamp.toISOString(),
        IsHidden: isHidden,
      });
    });

    it('should get item', async () => {
      const itemId = 'item1';
      const mockItem = { ItemId: itemId, Labels: ['label1'] };

      mockAxiosInstance.get.mockResolvedValue({ data: mockItem });

      const result = await client.getItem(itemId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/api/item/${itemId}`);
      expect(result).toEqual(mockItem);
    });

    it('should update item', async () => {
      const itemId = 'item1';
      const labels = ['label1'];
      const categories = ['cat1'];
      const isHidden = true;

      mockAxiosInstance.patch.mockResolvedValue({ data: {} });

      await client.updateItem(itemId, labels, categories, isHidden);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        `/api/item/${itemId}`,
        {
          Labels: labels,
          Categories: categories,
          IsHidden: isHidden,
        },
      );
    });

    it('should delete item', async () => {
      const itemId = 'item1';

      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await client.deleteItem(itemId);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        `/api/item/${itemId}`,
      );
    });
  });

  describe('Feedback Management', () => {
    it('should insert feedback', async () => {
      const feedback = {
        FeedbackType: 'LIKE',
        UserId: 'user1',
        ItemId: 'item1',
        Timestamp: new Date().toISOString(),
      };

      mockAxiosInstance.post.mockResolvedValue({ data: {} });

      await client.insertFeedback(feedback);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/feedback',
        feedback,
      );
    });
  });

  describe('Recommendation APIs', () => {
    it('should get recommendations', async () => {
      const userId = 'user1';
      const mockRecommendations = ['item1', 'item2'];

      mockAxiosInstance.get.mockResolvedValue({ data: mockRecommendations });

      const result = await client.getRecommend(
        userId,
        undefined,
        undefined,
        10,
        0,
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/recommend/user1?n=10&offset=0',
      );
      expect(result).toEqual(mockRecommendations);
    });

    it('should get recommendations by category', async () => {
      const userId = 'user1';
      const category = 'cat1';
      const mockRecommendations = ['item1', 'item2'];

      mockAxiosInstance.get.mockResolvedValue({ data: mockRecommendations });

      const result = await client.getRecommendByCategory(
        userId,
        category,
        undefined,
        undefined,
        10,
        0,
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/recommend/user1/cat1?n=10&offset=0',
      );
      expect(result).toEqual(mockRecommendations);
    });

    it('should get popular items', async () => {
      const mockPopular = [{ Id: 'item1', Score: 0.9 }];

      mockAxiosInstance.get.mockResolvedValue({ data: mockPopular });

      const result = await client.getPopular(undefined, 10, 0);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/popular?n=10&offset=0',
      );
      expect(result).toEqual(mockPopular);
    });

    it('should get popular items by category', async () => {
      const category = 'cat1';
      const mockPopular = [{ Id: 'item1', Score: 0.9 }];

      mockAxiosInstance.get.mockResolvedValue({ data: mockPopular });

      const result = await client.getPopularByCategory(
        category,
        undefined,
        10,
        0,
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/popular/cat1?n=10&offset=0',
      );
      expect(result).toEqual(mockPopular);
    });

    it('should get latest items', async () => {
      const mockLatest = ['item1', 'item2'];

      mockAxiosInstance.get.mockResolvedValue({ data: mockLatest });

      const result = await client.getLatest(10);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/latest/10');
      expect(result).toEqual(mockLatest);
    });

    it('should get similar items', async () => {
      const itemId = 'item1';
      const mockSimilar = [{ Id: 'item2', Score: 0.8 }];

      mockAxiosInstance.get.mockResolvedValue({ data: mockSimilar });

      const result = await client.getSimilar(itemId, 10);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/item/item1/neighbors?n=10',
      );
      expect(result).toEqual(mockSimilar);
    });

    it('should get user neighbors', async () => {
      const userId = 'user1';
      const mockNeighbors = [{ Id: 'user2', Score: 0.8 }];

      mockAxiosInstance.get.mockResolvedValue({ data: mockNeighbors });

      const result = await client.getUserNeighbors(userId, 10, 0);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/user/user1/neighbors?n=10&offset=0',
      );
      expect(result).toEqual(mockNeighbors);
    });
  });

  describe('Health Check APIs', () => {
    it('should check liveness', async () => {
      const mockStatus = { status: 'ok' };

      mockAxiosInstance.get.mockResolvedValue({ data: mockStatus });

      const result = await client.getLiveness();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/health/live');
      expect(result).toEqual(mockStatus);
    });

    it('should check readiness', async () => {
      const mockStatus = { status: 'ok' };

      mockAxiosInstance.get.mockResolvedValue({ data: mockStatus });

      const result = await client.getReadiness();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/health/ready');
      expect(result).toEqual(mockStatus);
    });
  });
});
