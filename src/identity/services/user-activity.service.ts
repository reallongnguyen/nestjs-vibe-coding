import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { UserActivityType } from 'src/generated/client';

import { IUserActivityRepository } from './interfaces/user-activity.repository.interface';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserRoleChangedEvent,
  UserDeactivatedEvent,
  UserActivatedEvent,
  UserDeletedEvent,
} from '../entities/events/user.events';
import { UserActivity } from '../entities/user-activity.entity';

@Injectable()
export class UserActivityService {
  constructor(
    private readonly logger: Logger,
    @Inject('IUserActivityRepository')
    private readonly userActivityRepository: IUserActivityRepository,
  ) {}

  public async handleUserCreated(
    event: UserCreatedEvent,
  ): Promise<UserActivity> {
    const activity = new UserActivity({
      id: crypto.randomUUID(),
      userId: event.payload.userId,
      performedBy: event.payload.userId,
      activityType: UserActivityType.ACCOUNT_CREATED,
      details: {
        email: event.payload.email,
        firstName: event.payload.firstName,
        lastName: event.payload.lastName,
        avatar: event.payload.avatar,
      },
      metadata: {
        roles: event.payload.roles,
      },
      timestamp: new Date(event.metadata.timestamp),
      ipAddress: null,
      userAgent: null,
      success: true,
      location: null,
      deviceId: null,
    });

    return this.userActivityRepository.create(activity);
  }

  public async handleUserUpdated(
    event: UserUpdatedEvent,
  ): Promise<UserActivity> {
    const activity = new UserActivity({
      id: crypto.randomUUID(),
      userId: event.payload.userId,
      performedBy: event.payload.userId,
      activityType: UserActivityType.PROFILE_UPDATE,
      details: {
        firstName: event.payload.firstName,
        lastName: event.payload.lastName,
        avatar: event.payload.avatar,
      },
      metadata: {},
      timestamp: new Date(event.metadata.timestamp),
      ipAddress: null,
      userAgent: null,
      success: true,
      location: null,
      deviceId: null,
    });

    return this.userActivityRepository.create(activity);
  }

  public async handleUserRoleChanged(
    event: UserRoleChangedEvent,
  ): Promise<UserActivity> {
    const activity = new UserActivity({
      id: crypto.randomUUID(),
      userId: event.payload.userId,
      performedBy: event.payload.operatorId,
      activityType: UserActivityType.ROLE_CHANGE,
      details: {},
      metadata: {
        newRoles: event.payload.roles,
      },
      timestamp: new Date(event.metadata.timestamp),
      ipAddress: null,
      userAgent: null,
      success: true,
      location: null,
      deviceId: null,
    });

    return this.userActivityRepository.create(activity);
  }

  public async handleUserDeactivated(
    event: UserDeactivatedEvent,
  ): Promise<UserActivity> {
    const activity = new UserActivity({
      id: crypto.randomUUID(),
      userId: event.payload.userId,
      performedBy: event.payload.operatorId,
      activityType: UserActivityType.ACCOUNT_DEACTIVATED,
      details: {},
      metadata: {},
      timestamp: new Date(event.metadata.timestamp),
      ipAddress: null,
      userAgent: null,
      success: true,
      location: null,
      deviceId: null,
    });

    return this.userActivityRepository.create(activity);
  }

  public async handleUserActivated(
    event: UserActivatedEvent,
  ): Promise<UserActivity> {
    const activity = new UserActivity({
      id: crypto.randomUUID(),
      userId: event.payload.userId,
      performedBy: event.payload.operatorId,
      activityType: UserActivityType.ACCOUNT_ACTIVATED,
      details: {},
      metadata: {},
      timestamp: new Date(event.metadata.timestamp),
      ipAddress: null,
      userAgent: null,
      success: true,
      location: null,
      deviceId: null,
    });

    return this.userActivityRepository.create(activity);
  }

  public async handleUserDeleted(
    event: UserDeletedEvent,
  ): Promise<UserActivity> {
    const activity = new UserActivity({
      id: crypto.randomUUID(),
      userId: event.payload.userId,
      performedBy: event.payload.operatorId,
      activityType: UserActivityType.ACCOUNT_DELETED,
      details: {},
      metadata: {},
      timestamp: new Date(event.metadata.timestamp),
      ipAddress: null,
      userAgent: null,
      success: true,
      location: null,
      deviceId: null,
    });

    return this.userActivityRepository.create(activity);
  }
}
