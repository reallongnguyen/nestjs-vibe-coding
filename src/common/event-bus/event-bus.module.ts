import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBusAdapter } from './adapters/infrastructure/event-bus.adapter';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    {
      provide: 'EventBusPort',
      useClass: EventBusAdapter,
    },
  ],
  exports: ['EventBusPort'],
})
export class EventBusModule {}
