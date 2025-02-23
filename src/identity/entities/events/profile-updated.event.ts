import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';
import { IProfileUpdatedEvent } from 'src/common/event-bus/core/domain/events/event.interface';

import { User } from '../user.entity';

const EVENT_NAME = 'user.profile.updated';
export class ProfileUpdatedEvent
  extends BaseEvent
  implements IProfileUpdatedEvent
{
  id: string;
  name: string;
  avatar?: string;

  constructor(user: User, params?: ConstructorParameters<typeof BaseEvent>[0]) {
    super(params);

    this.id = user.id;
    this.name = user.firstName;
    this.avatar = user.avatar;
  }

  eventName(): string {
    return EVENT_NAME;
  }

  static getEventName(): string {
    return EVENT_NAME;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
    };
  }
}
