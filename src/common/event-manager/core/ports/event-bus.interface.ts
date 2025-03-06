import { BaseEvent } from '../domain/events/base.event';

export interface EventBus {
  publish<T>(event: BaseEvent<T>): Promise<void>;
}
