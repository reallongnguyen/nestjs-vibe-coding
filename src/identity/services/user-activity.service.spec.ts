import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { UserActivityType } from '@prisma/client';

import { UserActivityService } from './user-activity.service';
import { IUserActivityRepository } from './interfaces/user-activity.repository.interface';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserRoleChangedEvent,
  UserDeactivatedEvent,
  UserActivatedEvent,
  UserDeletedEvent,
} from '../entities/events/user.events';
import { Role } from '../entities/role.enum';

describe('UserActivityService', () => {
  let service: UserActivityService;
  let userActivityRepository: jest.Mocked<IUserActivityRepository>;

  const mockUserId = 'user-123';
  const mockOperatorId = 'operator-123';

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserActivityService,
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: 'IUserActivityRepository',
          useValue: {
            create: jest.fn(),
            findByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserActivityService>(UserActivityService);
    userActivityRepository = module.get('IUserActivityRepository');
  });

  describe('handleUserCreated', () => {
    it('should create activity record for user creation', async () => {
      const event = new UserCreatedEvent(
        {
          id: mockUserId,
          authId: 'auth-123',
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'avatar.jpg',
          roles: [Role.USER],
          isActive: true,
          email: 'john@example.com',
          phone: '+1234567890',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          correlationId: 'test-correlation-id',
          metadata: { test: 'metadata' },
        },
      );

      userActivityRepository.create.mockResolvedValue({} as any);

      await service.handleUserCreated(event);

      expect(userActivityRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          performedBy: mockUserId,
          activityType: UserActivityType.ACCOUNT_CREATED,
          details: {
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            avatar: 'avatar.jpg',
          },
          metadata: {
            roles: [Role.USER],
          },
          timestamp: expect.any(Date),
        }),
      );
    });
  });

  describe('handleUserUpdated', () => {
    it('should create activity record for profile update', async () => {
      const event = new UserUpdatedEvent(
        {
          id: mockUserId,
          authId: 'auth-123',
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'new-avatar.jpg',
          roles: [Role.USER],
          isActive: true,
          email: 'john@example.com',
          phone: '+1234567890',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          correlationId: 'test-correlation-id',
          metadata: { test: 'metadata' },
        },
      );

      userActivityRepository.create.mockResolvedValue({} as any);

      await service.handleUserUpdated(event);

      expect(userActivityRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          performedBy: mockUserId,
          activityType: UserActivityType.PROFILE_UPDATE,
          details: {
            firstName: 'John',
            lastName: 'Doe',
            avatar: 'new-avatar.jpg',
          },
          timestamp: expect.any(Date),
        }),
      );
    });
  });

  describe('handleUserRoleChanged', () => {
    it('should create activity record for role change', async () => {
      const event = new UserRoleChangedEvent(
        mockUserId,
        [Role.ADMIN],
        mockOperatorId,
        {
          correlationId: 'test-correlation-id',
          metadata: { test: 'metadata' },
        },
      );

      userActivityRepository.create.mockResolvedValue({} as any);

      await service.handleUserRoleChanged(event);

      expect(userActivityRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          performedBy: mockOperatorId,
          activityType: UserActivityType.ROLE_CHANGE,
          metadata: {
            newRoles: [Role.ADMIN],
          },
          timestamp: expect.any(Date),
        }),
      );
    });
  });

  describe('handleUserDeactivated', () => {
    it('should create activity record for account deactivation', async () => {
      const event = new UserDeactivatedEvent(mockUserId, mockOperatorId, {
        correlationId: 'test-correlation-id',
        metadata: { test: 'metadata' },
      });

      userActivityRepository.create.mockResolvedValue({} as any);

      await service.handleUserDeactivated(event);

      expect(userActivityRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          performedBy: mockOperatorId,
          activityType: UserActivityType.ACCOUNT_DEACTIVATED,
          timestamp: expect.any(Date),
        }),
      );
    });
  });

  describe('handleUserActivated', () => {
    it('should create activity record for account activation', async () => {
      const event = new UserActivatedEvent(mockUserId, mockOperatorId, {
        correlationId: 'test-correlation-id',
        metadata: { test: 'metadata' },
      });

      userActivityRepository.create.mockResolvedValue({} as any);

      await service.handleUserActivated(event);

      expect(userActivityRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          performedBy: mockOperatorId,
          activityType: UserActivityType.ACCOUNT_ACTIVATED,
          timestamp: expect.any(Date),
        }),
      );
    });
  });

  describe('handleUserDeleted', () => {
    it('should create activity record for account deletion', async () => {
      const event = new UserDeletedEvent(mockUserId, mockOperatorId, {
        correlationId: 'test-correlation-id',
        metadata: { test: 'metadata' },
      });

      userActivityRepository.create.mockResolvedValue({} as any);

      await service.handleUserDeleted(event);

      expect(userActivityRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          performedBy: mockOperatorId,
          activityType: UserActivityType.ACCOUNT_DELETED,
          timestamp: expect.any(Date),
        }),
      );
    });
  });
});
