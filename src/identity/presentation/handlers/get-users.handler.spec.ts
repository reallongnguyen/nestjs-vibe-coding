import { User } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { IEventBus } from '@nestjs/cqrs';
import { GetUsersCommand } from '../../../feed/entities/commands/get-users.command';
import { UserRepository } from '../../repositories/user.repository';
import { Role } from '../../entities/role.enum';
import { GetUsersHandler } from './get-users.handler';
import { UserActivityRepository } from '../../repositories/user-activity.repository';
import { UserInfo } from '../../../feed/entities/feed.types';
import { IdentityErrorFactory } from '../../entities/errors';

describe('GetUsersHandler', () => {
  let handler: GetUsersHandler;
  let userRepository: jest.Mocked<UserRepository>;
  let logger: jest.Mocked<Logger>;
  let eventBus: jest.Mocked<IEventBus>;
  let userActivityRepository: jest.Mocked<UserActivityRepository>;

  beforeEach(async () => {
    userRepository = {
      findByIds: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    eventBus = {
      publish: jest.fn(),
    } as any;

    userActivityRepository = {} as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUsersHandler,
        {
          provide: UserRepository,
          useValue: userRepository,
        },
        {
          provide: Logger,
          useValue: logger,
        },
        {
          provide: 'IEventBus',
          useValue: eventBus,
        },
        {
          provide: UserActivityRepository,
          useValue: userActivityRepository,
        },
      ],
    }).compile();

    handler = module.get<GetUsersHandler>(GetUsersHandler);
  });

  describe('execute', () => {
    it('should return users for given IDs', async () => {
      const userIds = ['1', '2'];
      const mockUsers: User[] = [
        {
          id: '1',
          authId: 'auth1',
          firstName: 'User 1',
          lastName: 'Last 1',
          email: 'user1@example.com',
          phone: null,
          avatar: 'avatar1.jpg',
          roles: [Role.USER],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          authId: 'auth2',
          firstName: 'User 2',
          lastName: 'Last 2',
          email: 'user2@example.com',
          phone: null,
          avatar: 'avatar2.jpg',
          roles: [Role.USER],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const expectedUserInfo: UserInfo[] = [
        {
          id: '1',
          firstName: 'User 1',
          lastName: 'Last 1',
          avatarUrl: 'avatar1.jpg',
        },
        {
          id: '2',
          firstName: 'User 2',
          lastName: 'Last 2',
          avatarUrl: 'avatar2.jpg',
        },
      ];

      userRepository.findByIds.mockResolvedValue(mockUsers);

      const command = new GetUsersCommand(userIds);
      const result = await handler.execute(command);

      expect(result).toEqual(expectedUserInfo);
      expect(userRepository.findByIds).toHaveBeenCalledWith(userIds);
      expect(logger.debug).toHaveBeenCalledWith('Getting users for IDs: 1, 2');
      expect(logger.debug).toHaveBeenCalledWith('Found 2 users');
    });

    it('should handle empty user IDs array', async () => {
      const command = new GetUsersCommand([]);
      const result = await handler.execute(command);

      expect(result).toEqual([]);
      expect(userRepository.findByIds).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('Getting users for IDs: ');
      expect(logger.debug).toHaveBeenCalledWith('Found 0 users');
    });

    it('should handle case when no users are found', async () => {
      const userIds = ['1', '2'];
      userRepository.findByIds.mockResolvedValue([]);

      const command = new GetUsersCommand(userIds);
      const result = await handler.execute(command);

      expect(result).toEqual([]);
      expect(userRepository.findByIds).toHaveBeenCalledWith(userIds);
      expect(logger.debug).toHaveBeenCalledWith('Getting users for IDs: 1, 2');
      expect(logger.debug).toHaveBeenCalledWith('Found 0 users');
    });

    it('should handle errors and rethrow identity errors', async () => {
      const userIds = ['1', '2'];
      const error = IdentityErrorFactory.userQueryFailed(
        new Error('Test error'),
      );

      userRepository.findByIds.mockRejectedValue(error);

      const command = new GetUsersCommand(userIds);
      await expect(handler.execute(command)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get users: Test error',
      );
    });

    it('should wrap non-identity errors', async () => {
      const userIds = ['1', '2'];
      const error = new Error('Test error');

      userRepository.findByIds.mockRejectedValue(error);

      const command = new GetUsersCommand(userIds);
      await expect(handler.execute(command)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get users: Test error',
      );
    });
  });
});
