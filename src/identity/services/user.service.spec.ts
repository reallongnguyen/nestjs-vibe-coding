import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';

import { UserService } from './user.service';
import { IUserRepository } from './interfaces/user.repository.interface';
import { Role } from '../entities/role.enum';
import { User } from '../entities/user.entity';
import { BulkOperationType } from '../presentation/dtos/bulk-user-operation.input';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserRoleChangedEvent,
  UserDeactivatedEvent,
  UserActivatedEvent,
  UserDeletedEvent,
} from '../entities/events/user.events';

class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

interface EventBusPort {
  publish(event: any): Promise<void>;
}

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<IUserRepository>;
  let eventBus: jest.Mocked<EventBusPort>;

  const mockUser: User = {
    id: '1',
    authId: 'auth1',
    firstName: 'John',
    lastName: null,
    avatar: null,
    roles: [Role.USER],
    isActive: true,
    email: 'john@example.com',
    phone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: 'IUserRepository',
          useValue: {
            findById: jest.fn(),
            findUnique: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
            search: jest.fn(),
            updateRole: jest.fn(),
            deactivate: jest.fn(),
            activate: jest.fn(),
            delete: jest.fn(),
            createPasswordReset: jest.fn(),
          },
        },
        {
          provide: 'IEventBus',
          useValue: mockEventBus,
        },
        {
          provide: 'IUserActivityRepository',
          useValue: {
            findByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = new UserService(
      module.get(Logger),
      module.get('IUserRepository'),
      module.get('IEventBus'),
      module.get('IUserActivityRepository'),
    );

    userRepository = module.get('IUserRepository');
    eventBus = module.get('IEventBus');
  });

  describe('createOrUpdateUser', () => {
    const input = {
      authId: 'auth1',
      name: 'John',
      email: 'john@example.com',
    };

    it('should emit UserCreatedEvent when creating a new user', async () => {
      userRepository.findUnique.mockResolvedValue(null);
      userRepository.upsert.mockResolvedValue(mockUser);

      await service.createOrUpdateUser(input);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(UserCreatedEvent),
      );
    });

    it('should emit UserUpdatedEvent when updating an existing user', async () => {
      userRepository.findUnique.mockResolvedValue(mockUser);
      userRepository.upsert.mockResolvedValue(mockUser);

      await service.createOrUpdateUser(input);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(UserUpdatedEvent),
      );
    });
  });

  describe('updateProfile', () => {
    const userId = '1';
    const input = {
      name: 'John Updated',
      avatar: 'new-avatar.jpg',
    };

    it('should emit UserUpdatedEvent when profile is updated', async () => {
      userRepository.findUnique.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({
        ...mockUser,
        firstName: input.name,
        avatar: input.avatar,
      });

      await service.updateProfile(userId, input);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(UserUpdatedEvent),
      );
    });

    it('should throw error when user not found', async () => {
      userRepository.findUnique.mockResolvedValue(null);

      await expect(service.updateProfile(userId, input)).rejects.toThrow(
        AppError,
      );
    });
  });

  describe('processBulkOperation', () => {
    const userIds = ['1', '2'];
    const operatorId = 'operator1';

    it('should emit UserRoleChangedEvent when updating roles', async () => {
      const operation = {
        operation: BulkOperationType.UPDATE_ROLE,
        userIds,
        newRoles: [Role.ADMIN],
      };

      userRepository.updateRole.mockResolvedValue(mockUser);

      await service.processBulkOperation(operation, operatorId);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(UserRoleChangedEvent),
      );
    });

    it('should emit UserDeactivatedEvent when deactivating users', async () => {
      const operation = {
        operation: BulkOperationType.DEACTIVATE,
        userIds,
      };

      userRepository.deactivate.mockResolvedValue(mockUser);

      await service.processBulkOperation(operation, operatorId);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(UserDeactivatedEvent),
      );
    });

    it('should emit UserActivatedEvent when activating users', async () => {
      const operation = {
        operation: BulkOperationType.ACTIVATE,
        userIds,
      };

      userRepository.activate.mockResolvedValue(mockUser);

      await service.processBulkOperation(operation, operatorId);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(UserActivatedEvent),
      );
    });

    it('should emit UserDeletedEvent when deleting users', async () => {
      const operation = {
        operation: BulkOperationType.DELETE,
        userIds,
      };

      userRepository.delete.mockResolvedValue(undefined);

      await service.processBulkOperation(operation, operatorId);

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(UserDeletedEvent),
      );
    });

    it('should handle errors and track failures', async () => {
      const operation = {
        operation: BulkOperationType.UPDATE_ROLE,
        userIds,
        newRoles: [Role.ADMIN],
      };

      userRepository.updateRole.mockRejectedValue(new Error('Test error'));

      const result = await service.processBulkOperation(operation, operatorId);

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(2);
      expect(result.errors).toHaveLength(2);
    });
  });
});
