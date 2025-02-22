import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { RoleChangeEvent } from '../entities/events/role-change.event';
import { AccountActivatedEvent } from '../entities/events/account-activated.event';
import { AccountDeactivatedEvent } from '../entities/events/account-deactivated.event';
import { AccountDeletedEvent } from '../entities/events/account-deleted.event';
import { ProfileUpdatedEvent } from '../entities/events/profile-updated.event';
import { UserActivityService } from '../services/user-activity.service';

@Injectable()
export class UserActivityHandler {
  constructor(private readonly userActivityService: UserActivityService) {}

  @OnEvent(RoleChangeEvent.getEventName())
  handleRoleChange(event: RoleChangeEvent) {
    return this.userActivityService.handleEvent(event);
  }

  @OnEvent(AccountActivatedEvent.getEventName())
  handleAccountActivated(event: AccountActivatedEvent) {
    return this.userActivityService.handleEvent(event);
  }

  @OnEvent(AccountDeactivatedEvent.getEventName())
  handleAccountDeactivated(event: AccountDeactivatedEvent) {
    return this.userActivityService.handleEvent(event);
  }

  @OnEvent(AccountDeletedEvent.getEventName())
  handleAccountDeleted(event: AccountDeletedEvent) {
    return this.userActivityService.handleEvent(event);
  }

  @OnEvent(ProfileUpdatedEvent.getEventName())
  handleProfileUpdated(event: ProfileUpdatedEvent) {
    return this.userActivityService.handleEvent(event);
  }
}
