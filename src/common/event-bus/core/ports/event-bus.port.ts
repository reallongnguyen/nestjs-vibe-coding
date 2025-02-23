import { BaseEvent } from '../domain/events/base.event';

export interface EventBusPort {
  publish<T extends BaseEvent>(event: T): Promise<void>;
}
