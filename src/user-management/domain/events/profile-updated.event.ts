import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';
import { IProfileUpdatedEvent } from 'src/common/event-bus/core/domain/events/event.interface';

import { User } from '../entities/user.entity';

const EVENT_NAME = 'user.profile.updated';
export class ProfileUpdatedEvent
  extends BaseEvent
  implements IProfileUpdatedEvent
{
  id: string;
  name: string;
  avatar?: string;

  constructor(user: User) {
    super(new Date());

    this.id = user.id;
    this.name = user.name;
    this.avatar = user.avatar;
  }

  eventName(): string {
    return EVENT_NAME;
  }

  static getEventName(): string {
    return EVENT_NAME;
  }
}
