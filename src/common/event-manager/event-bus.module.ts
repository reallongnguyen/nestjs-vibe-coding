import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBusAdapter } from './adapters/event-bus.adapter';
import { EVENT_BUS_TOKEN } from './core/domain/entities/tokens';
import { EventValidator } from './core/domain/validation/event.validator';

/**
 * Module for event bus functionality
 * Provides event publishing and subscription capabilities
 *
 * Usage:
 * 1. Import EventBusModule in your module:
 *    ```typescript
 *    @Module({
 *      imports: [EventBusModule],
 *    })
 *    export class YourModule {}
 *    ```
 *
 * 2. Publish events:
 *    ```typescript
 *    @Injectable()
 *    export class YourService {
 *      constructor(private readonly eventBus: EventBusAdapter) {}
 *
 *      async someMethod() {
 *        await this.eventBus.publish(new YourEvent(payload));
 *      }
 *    }
 *    ```
 *
 * 3. Subscribe to events using @OnEvent decorator:
 *    ```typescript
 *    @Injectable()
 *    export class YourHandler {
 *      @OnEvent('your.event.name')
 *      async handleYourEvent(event: EventBusMessage<YourEventPayload>) {
 *        // Handle the event
 *      }
 *    }
 *    ```
 */
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Enable wildcard event listeners
      wildcard: true,
      // Remove listeners after they are called
      delimiter: '.',
      // Maximum number of listeners per event
      maxListeners: 20,
      // Enable verbose logging
      verboseMemoryLeak: true,
    }),
  ],
  providers: [
    EventValidator,
    {
      provide: EVENT_BUS_TOKEN,
      useClass: EventBusAdapter,
    },
  ],
  exports: [EVENT_BUS_TOKEN],
})
export class EventBusModule {}
