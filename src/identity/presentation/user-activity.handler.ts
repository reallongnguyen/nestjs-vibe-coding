import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserRoleChangedEvent,
  UserDeactivatedEvent,
  UserActivatedEvent,
  UserDeletedEvent,
  USER_EVENTS,
} from '../entities/events/user.events';
import { UserActivityService } from '../services/user-activity.service';

@Injectable()
export class UserActivityHandler {
  constructor(private readonly userActivityService: UserActivityService) {}

  @OnEvent(USER_EVENTS.USER_CREATED.eventName)
  handleUserCreated(event: UserCreatedEvent) {
    return this.userActivityService.handleUserCreated(event);
  }

  @OnEvent(USER_EVENTS.USER_UPDATED.eventName)
  handleUserUpdated(event: UserUpdatedEvent) {
    return this.userActivityService.handleUserUpdated(event);
  }

  @OnEvent(USER_EVENTS.USER_ROLE_CHANGED.eventName)
  handleUserRoleChanged(event: UserRoleChangedEvent) {
    return this.userActivityService.handleUserRoleChanged(event);
  }

  @OnEvent(USER_EVENTS.USER_DEACTIVATED.eventName)
  handleUserDeactivated(event: UserDeactivatedEvent) {
    return this.userActivityService.handleUserDeactivated(event);
  }

  @OnEvent(USER_EVENTS.USER_ACTIVATED.eventName)
  handleUserActivated(event: UserActivatedEvent) {
    return this.userActivityService.handleUserActivated(event);
  }

  @OnEvent(USER_EVENTS.USER_DELETED.eventName)
  handleUserDeleted(event: UserDeletedEvent) {
    return this.userActivityService.handleUserDeleted(event);
  }
}
