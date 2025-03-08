import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBusAdapter } from './adapters/infrastructure/event-bus.adapter';
import { EVENT_BUS_TOKEN } from './core/domain/entities/tokens';

/**
 * Module for event bus functionality
 * Provides event publishing and subscription capabilities
 */
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    {
      provide: EVENT_BUS_TOKEN,
      useClass: EventBusAdapter,
    },
  ],
  exports: [EVENT_BUS_TOKEN],
})
export class EventBusModule {}
