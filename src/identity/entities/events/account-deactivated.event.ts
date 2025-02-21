import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';
import { IAccountDeactivatedEvent } from 'src/common/event-bus/core/domain/events/event.interface';

const EVENT_NAME = 'user.account.deactivated';

export class AccountDeactivatedEvent
  extends BaseEvent
  implements IAccountDeactivatedEvent
{
  userId: string;
  performedBy: string;

  constructor(userId: string, operatorId: string) {
    super(new Date());

    this.userId = userId;
    this.performedBy = operatorId;
  }

  eventName(): string {
    return EVENT_NAME;
  }

  static getEventName(): string {
    return EVENT_NAME;
  }
}
