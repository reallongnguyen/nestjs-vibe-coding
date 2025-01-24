import { BaseEvent } from 'src/common/event-bus/core/domain/events/base.event';
import { IProfileUpdatedEvent } from 'src/common/event-bus/core/domain/events/event.interface';

import { User } from '../entities/user.entity';

export class ProfileUpdatedEvent
  extends BaseEvent
  implements IProfileUpdatedEvent
{
  id: string;
  name: string;
  avatar?: string;

  constructor(public readonly user: User) {
    super();

    this.id = user.id;
    this.name = user.name;
    this.avatar = user.avatar;
  }

  eventName(): string {
    return 'profile.updated';
  }
}
