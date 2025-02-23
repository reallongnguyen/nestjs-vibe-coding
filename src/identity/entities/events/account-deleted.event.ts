import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';
import { IAccountDeletedEvent } from 'src/common/event-bus/core/domain/events/event.interface';

const EVENT_NAME = 'user.account.deleted';

export class AccountDeletedEvent
  extends BaseEvent
  implements IAccountDeletedEvent
{
  userId: string;
  performedBy: string;

  constructor(
    userId: string,
    operatorId: string,
    params?: ConstructorParameters<typeof BaseEvent>[0],
  ) {
    super(params);

    this.userId = userId;
    this.performedBy = operatorId;
  }

  eventName(): string {
    return EVENT_NAME;
  }

  static getEventName(): string {
    return EVENT_NAME;
  }

  toJSON(): Record<string, unknown> {
    return {
      userId: this.userId,
      performedBy: this.performedBy,
    };
  }
}
