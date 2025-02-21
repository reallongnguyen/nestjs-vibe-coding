import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';
import { IRoleChangeEvent } from 'src/common/event-bus/core/domain/events/event.interface';

const EVENT_NAME = 'user.role.change';

export class RoleChangeEvent extends BaseEvent implements IRoleChangeEvent {
  userId: string;
  newRoles: string[];
  performedBy: string;

  constructor(userId: string, newRoles: string[], operatorId: string) {
    super(new Date());

    this.userId = userId;
    this.newRoles = newRoles;
    this.performedBy = operatorId;
  }

  eventName(): string {
    return EVENT_NAME;
  }

  static getEventName(): string {
    return EVENT_NAME;
  }
}
