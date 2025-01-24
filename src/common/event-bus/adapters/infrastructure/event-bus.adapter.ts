import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBusPort } from '../../core/ports/event-bus.port';
import { BaseEvent } from '../../core/domain/events/base.event';

@Injectable()
export class EventBusAdapter implements EventBusPort {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish(event: BaseEvent): void {
    this.eventEmitter.emit(event.eventName(), event);
  }
}
