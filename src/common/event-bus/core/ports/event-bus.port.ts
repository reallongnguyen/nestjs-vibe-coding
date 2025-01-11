import { DomainEvent } from '../domain/events/base.event';

export interface EventBusPort {
  publish(event: DomainEvent): void;
}
