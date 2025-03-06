import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BaseEvent } from '../../core/domain/events/base.event';
import { EventBus } from '../../core/ports/event-bus.interface';

@Injectable()
export class EventBusAdapter implements EventBus {
  private readonly logger = new Logger(EventBusAdapter.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish<T>(event: BaseEvent<T>): Promise<void> {
    this.logger.verbose(`Publishing event: ${event.eventName}`);

    await this.eventEmitter.emitAsync(event.eventName, event);
  }
}
