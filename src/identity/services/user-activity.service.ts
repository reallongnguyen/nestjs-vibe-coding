import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { UserActivityType } from '@prisma/client';
import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';

import { IUserActivityRepository } from './interfaces/user-activity.repository.interface';
import { RoleChangeEvent } from '../entities/events/role-change.event';
import { AccountActivatedEvent } from '../entities/events/account-activated.event';
import { AccountDeactivatedEvent } from '../entities/events/account-deactivated.event';
import { AccountDeletedEvent } from '../entities/events/account-deleted.event';
import { ProfileUpdatedEvent } from '../entities/events/profile-updated.event';
import { UserActivity } from '../entities/user-activity.entity';

@Injectable()
export class UserActivityService {
  constructor(
    private readonly logger: Logger,
    @Inject('IUserActivityRepository')
    private readonly userActivityRepository: IUserActivityRepository,
  ) {}

  async handleEvent(event: BaseEvent): Promise<UserActivity> {
    switch (event.constructor) {
      case RoleChangeEvent:
        return this.handleRoleChange(event as RoleChangeEvent);
      case AccountActivatedEvent:
        return this.handleAccountActivated(event as AccountActivatedEvent);
      case AccountDeactivatedEvent:
        return this.handleAccountDeactivated(event as AccountDeactivatedEvent);
      case AccountDeletedEvent:
        return this.handleAccountDeleted(event as AccountDeletedEvent);
      case ProfileUpdatedEvent:
        return this.handleProfileUpdated(event as ProfileUpdatedEvent);
      default:
        throw new Error(`Unhandled event type: ${event.constructor.name}`);
    }
  }

  private async handleRoleChange(
    event: RoleChangeEvent,
  ): Promise<UserActivity> {
    const activity = new UserActivity({
      id: crypto.randomUUID(),
      userId: event.userId,
      performedBy: event.performedBy,
      activityType: UserActivityType.ROLE_CHANGE,
      details: {},
      metadata: {
        newRoles: event.newRoles,
      },
      timestamp: event.occurredOn,
      ipAddress: null,
      userAgent: null,
      success: true,
      location: null,
      deviceId: null,
    });

    return this.userActivityRepository.create(activity);
  }

  private async handleAccountActivated(
    event: AccountActivatedEvent,
  ): Promise<UserActivity> {
    const activity = new UserActivity({
      userId: event.userId,
      performedBy: event.performedBy,
      activityType: UserActivityType.ACCOUNT_ACTIVATED,
      details: {},
      metadata: {},
      timestamp: event.occurredOn,
      ipAddress: null,
      userAgent: null,
      success: true,
      location: null,
      deviceId: null,
    });

    return this.userActivityRepository.create(activity);
  }

  private async handleAccountDeactivated(
    event: AccountDeactivatedEvent,
  ): Promise<UserActivity> {
    const activity = new UserActivity({
      userId: event.userId,
      performedBy: event.performedBy,
      activityType: UserActivityType.ACCOUNT_DEACTIVATED,
      details: {},
      metadata: {},
      timestamp: event.occurredOn,
      ipAddress: null,
      userAgent: null,
      success: true,
      location: null,
      deviceId: null,
    });

    return this.userActivityRepository.create(activity);
  }

  private async handleAccountDeleted(
    event: AccountDeletedEvent,
  ): Promise<UserActivity> {
    const activity = new UserActivity({
      userId: event.userId,
      performedBy: event.performedBy,
      activityType: UserActivityType.ACCOUNT_DELETED,
      details: {},
      metadata: {},
      timestamp: event.occurredOn,
      ipAddress: null,
      userAgent: null,
      success: true,
      location: null,
      deviceId: null,
    });

    return this.userActivityRepository.create(activity);
  }

  private async handleProfileUpdated(
    event: ProfileUpdatedEvent,
  ): Promise<UserActivity> {
    const activity = new UserActivity({
      userId: event.id,
      performedBy: event.id,
      activityType: UserActivityType.PROFILE_UPDATE,
      details: {
        changes: {
          name: event.name,
          avatar: event.avatar,
        },
      },
      metadata: {},
      timestamp: event.occurredOn,
      ipAddress: null,
      userAgent: null,
      success: true,
      location: null,
      deviceId: null,
    });

    return this.userActivityRepository.create(activity);
  }
}
