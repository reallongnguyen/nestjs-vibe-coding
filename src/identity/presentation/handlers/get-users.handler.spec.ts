import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { GetUsersHandler } from './get-users.handler';
import { UserService } from '../../services/user.service';
import { GetUsersCommand } from '../../../feed/entities/commands/get-users.command';
import { IdentityErrorFactory } from '../../entities/errors';

describe('GetUsersHandler', () => {
  let handler: GetUsersHandler;
  let userService: UserService;

  const mockUserService = {
    getUsersByIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUsersHandler,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetUsersHandler>(GetUsersHandler);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return user information for provided user IDs', async () => {
      // Arrange
      const userIds = ['user1', 'user2'];
      const command = new GetUsersCommand(userIds);

      const mockUsers = [
        {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'avatar1.jpg',
          authId: 'auth1',
          roles: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user2',
          firstName: 'Jane',
          lastName: 'Smith',
          avatar: 'avatar2.jpg',
          authId: 'auth2',
          roles: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserService.getUsersByIds.mockResolvedValue(mockUsers);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([
        {
          id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          avatarUrl: 'avatar1.jpg',
        },
        {
          id: 'user2',
          firstName: 'Jane',
          lastName: 'Smith',
          avatarUrl: 'avatar2.jpg',
        },
      ]);

      expect(userService.getUsersByIds).toHaveBeenCalledTimes(1);
      expect(userService.getUsersByIds).toHaveBeenCalledWith(userIds);
    });

    it('should return empty array when no user IDs are provided', async () => {
      // Arrange
      const userIds: string[] = [];
      const command = new GetUsersCommand(userIds);

      mockUserService.getUsersByIds.mockResolvedValue([]);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([]);
      expect(userService.getUsersByIds).toHaveBeenCalledTimes(1);
      expect(userService.getUsersByIds).toHaveBeenCalledWith(userIds);
    });

    it('should handle empty lastName gracefully', async () => {
      // Arrange
      const userIds = ['user1'];
      const command = new GetUsersCommand(userIds);

      const mockUsers = [
        {
          id: 'user1',
          firstName: 'John',
          lastName: null,
          avatar: 'avatar1.jpg',
          authId: 'auth1',
          roles: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserService.getUsersByIds.mockResolvedValue(mockUsers);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toEqual([
        {
          id: 'user1',
          firstName: 'John',
          lastName: '',
          avatarUrl: 'avatar1.jpg',
        },
      ]);
    });

    it('should propagate identity errors', async () => {
      // Arrange
      const userIds = ['user1', 'user2'];
      const command = new GetUsersCommand(userIds);
      const identityError = IdentityErrorFactory.userQueryFailed(
        new Error('Test error'),
      );

      mockUserService.getUsersByIds.mockRejectedValue(identityError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toHaveProperty(
        'code',
        identityError.code,
      );
    });

    it('should wrap non-identity errors in userQueryFailed', async () => {
      // Arrange
      const userIds = ['user1', 'user2'];
      const command = new GetUsersCommand(userIds);
      const error = new Error('Database error');

      mockUserService.getUsersByIds.mockRejectedValue(error);

      // Act
      try {
        await handler.execute(command);
        fail('Expected an error to be thrown');
      } catch (thrownError) {
        // Assert
        expect(thrownError.code).toEqual('USER_QUERY_FAILED');
      }
    });
  });
});
