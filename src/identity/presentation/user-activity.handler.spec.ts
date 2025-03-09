import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';

import { UserActivityHandler } from './user-activity.handler';
import { UserActivityService } from '../services/user-activity.service';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserRoleChangedEvent,
  UserDeactivatedEvent,
  UserActivatedEvent,
  UserDeletedEvent,
} from '../entities/events/user.events';
import { Role } from '../entities/role.enum';

describe('UserActivityHandler', () => {
  let handler: UserActivityHandler;
  let userActivityService: jest.Mocked<UserActivityService>;

  const mockUserId = 'user-123';
  const mockOperatorId = 'operator-123';

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserActivityHandler,
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: UserActivityService,
          useValue: {
            handleUserCreated: jest.fn(),
            handleUserUpdated: jest.fn(),
            handleUserRoleChanged: jest.fn(),
            handleUserDeactivated: jest.fn(),
            handleUserActivated: jest.fn(),
            handleUserDeleted: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<UserActivityHandler>(UserActivityHandler);
    userActivityService = module.get(UserActivityService);
  });

  describe('handleUserCreated', () => {
    it('should delegate to service', async () => {
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

      await handler.handleUserCreated(event);

      expect(userActivityService.handleUserCreated).toHaveBeenCalledWith(event);
    });
  });

  describe('handleUserUpdated', () => {
    it('should delegate to service', async () => {
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

      await handler.handleUserUpdated(event);

      expect(userActivityService.handleUserUpdated).toHaveBeenCalledWith(event);
    });
  });

  describe('handleUserRoleChanged', () => {
    it('should delegate to service', async () => {
      const event = new UserRoleChangedEvent(
        mockUserId,
        [Role.ADMIN],
        mockOperatorId,
        {
          correlationId: 'test-correlation-id',
          metadata: { test: 'metadata' },
        },
      );

      await handler.handleUserRoleChanged(event);

      expect(userActivityService.handleUserRoleChanged).toHaveBeenCalledWith(
        event,
      );
    });
  });

  describe('handleUserDeactivated', () => {
    it('should delegate to service', async () => {
      const event = new UserDeactivatedEvent(mockUserId, mockOperatorId, {
        correlationId: 'test-correlation-id',
        metadata: { test: 'metadata' },
      });

      await handler.handleUserDeactivated(event);

      expect(userActivityService.handleUserDeactivated).toHaveBeenCalledWith(
        event,
      );
    });
  });

  describe('handleUserActivated', () => {
    it('should delegate to service', async () => {
      const event = new UserActivatedEvent(mockUserId, mockOperatorId, {
        correlationId: 'test-correlation-id',
        metadata: { test: 'metadata' },
      });

      await handler.handleUserActivated(event);

      expect(userActivityService.handleUserActivated).toHaveBeenCalledWith(
        event,
      );
    });
  });

  describe('handleUserDeleted', () => {
    it('should delegate to service', async () => {
      const event = new UserDeletedEvent(mockUserId, mockOperatorId, {
        correlationId: 'test-correlation-id',
        metadata: { test: 'metadata' },
      });

      await handler.handleUserDeleted(event);

      expect(userActivityService.handleUserDeleted).toHaveBeenCalledWith(event);
    });
  });
});
