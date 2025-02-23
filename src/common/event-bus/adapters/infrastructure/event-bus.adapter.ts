import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { EventBusPort } from '../../core/ports/event-bus.port';
import { BaseEvent } from '../../core/domain/events/base.event';

@Injectable()
export class EventBusAdapter implements EventBusPort {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: Logger,
  ) {}

  async publish<T extends BaseEvent>(event: T): Promise<void> {
    this.logger.verbose(`Publishing event: ${event.eventName()}`);

    await this.eventEmitter.emitAsync(event.eventName(), event);
  }
}
