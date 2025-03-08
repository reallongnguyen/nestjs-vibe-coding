import { BaseEvent } from '../domain/events/base.event';

export interface EventBus {
  publish<T extends object>(event: BaseEvent<T>): Promise<void>;
}
