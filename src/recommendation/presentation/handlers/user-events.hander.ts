import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  EventBus,
  EventBusMessage,
  IdentityEventSchemas,
  InjectEventBus,
  SyncOperation,
} from 'src/common/event-manager';
import { UserSyncEvent } from 'src/recommendation/entities/events/gorse-sync.events';

@Injectable()
export class UserEventsHandler {
  private readonly logger = new Logger(UserEventsHandler.name);

  constructor(@InjectEventBus() private readonly eventBus: EventBus) {}

  @OnEvent(IdentityEventSchemas.USER_CREATED.eventName)
  handleUserCreated(
    event: EventBusMessage<typeof IdentityEventSchemas.USER_CREATED.schema>,
  ) {
    this.logger.verbose(
      `recommendation: user created: ${event.payload.userId}`,
    );

    const userSyncEvent = new UserSyncEvent({
      userId: event.payload.userId,
      labels: [],
      timestamp: event.metadata.timestamp,
      operation: SyncOperation.CREATE,
    });

    this.eventBus.publish(userSyncEvent);
  }

  @OnEvent(IdentityEventSchemas.USER_UPDATED.eventName)
  handleUserUpdated(
    event: EventBusMessage<typeof IdentityEventSchemas.USER_UPDATED.schema>,
  ) {
    this.logger.verbose(
      `recommendation: user updated: ${event.payload.userId}`,
    );

    const userSyncEvent = new UserSyncEvent({
      userId: event.payload.userId,
      labels: [],
      timestamp: event.metadata.timestamp,
      operation: SyncOperation.UPDATE,
    });

    this.eventBus.publish(userSyncEvent);
  }
}
