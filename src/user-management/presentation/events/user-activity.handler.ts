import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UserActivityType } from '@prisma/client';

import { RoleChangeEvent } from '../../domain/events/role-change.event';
import { AccountActivatedEvent } from '../../domain/events/account-activated.event';
import { AccountDeactivatedEvent } from '../../domain/events/account-deactivated.event';
import { AccountDeletedEvent } from '../../domain/events/account-deleted.event';
import { ProfileUpdatedEvent } from '../../domain/events/profile-updated.event';
import { UserActivity } from '../../domain/entities/user-activity.entity';

// TODO: Move logic to application service
@Injectable()
export class UserActivityHandler {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
  ) {}

  @OnEvent(RoleChangeEvent.getEventName())
  async handleRoleChange(event: RoleChangeEvent) {
    return this.prismaService.userActivity.create({
      data: {
        userId: event.userId,
        performedBy: event.performedBy,
        activityType: UserActivityType.ROLE_CHANGE,
        details: {
          newRoles: event.newRoles,
        },
        timestamp: event.occurredOn,
      },
    });
  }

  @OnEvent(AccountActivatedEvent.getEventName())
  async handleAccountActivated(event: AccountActivatedEvent) {
    return this.prismaService.userActivity.create({
      data: {
        userId: event.userId,
        performedBy: event.performedBy,
        activityType: UserActivityType.ACCOUNT_ACTIVATED,
        timestamp: event.occurredOn,
      },
    });
  }

  @OnEvent(AccountDeactivatedEvent.getEventName())
  handleAccountDeactivated(event: AccountDeactivatedEvent) {
    return this.prismaService.userActivity.create({
      data: {
        userId: event.userId,
        performedBy: event.performedBy,
        activityType: UserActivityType.ACCOUNT_DEACTIVATED,
        timestamp: event.occurredOn,
      },
    });
  }

  @OnEvent(AccountDeletedEvent.getEventName())
  handleAccountDeleted(event: AccountDeletedEvent) {
    return this.prismaService.userActivity.create({
      data: {
        userId: event.userId,
        performedBy: event.performedBy,
        activityType: UserActivityType.ACCOUNT_DELETED,
        timestamp: event.occurredOn,
      },
    });
  }

  @OnEvent(ProfileUpdatedEvent.getEventName())
  handleProfileUpdated(event: ProfileUpdatedEvent) {
    const activity = UserActivity.createProfileUpdateActivity(
      event.id,
      { name: event.name, avatar: event.avatar },
      event.id,
    );
    activity.timestamp = event.occurredOn;

    return this.prismaService.userActivity.create({
      data: activity,
    });
  }
}
