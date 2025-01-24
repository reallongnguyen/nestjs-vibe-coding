import { BaseEvent } from '../domain/events/base.event';

export interface EventBusPort {
  publish(event: BaseEvent): void;
}
