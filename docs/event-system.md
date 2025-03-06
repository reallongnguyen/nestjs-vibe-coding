# Event System

This document describes the event system used for inter-module communication in our application.

## Overview

The event system is designed to provide type-safe, versioned events for communication between modules. It follows these key principles:

- Events are defined once in a central location
- Events are strongly typed
- Events are versioned
- Modules explicitly declare which events they handle
- Event schema changes require explicit updates in consuming modules

## Event Structure

### Event Schema

Each event has a schema that defines:

- Event name (format: `{module}.{entity}.{action}`)
- Payload schema
- Version (following semver)
- Owning module
- Description

Example:

```typescript
export const UserEventSchemas = {
  ACCOUNT_ACTIVATED: {
    eventName: 'user.account.activated',
    schema: {
      userId: string;
      performedBy: string;
    },
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user account is activated'
  }
}
```

### Event Implementation

Events are implemented as classes that extend `BaseEvent`:

```typescript
export class AccountActivatedEvent extends BaseEvent<AccountActivatedSchema> {
  constructor(
    public readonly userId: string,
    public readonly performedBy: string,
    params?: EventMetadata,
  ) {
    super(UserEventSchemas.ACCOUNT_ACTIVATED, params);
  }

  toJSON() {
    return {
      userId: this.userId,
      performedBy: this.performedBy,
    };
  }
}
```

## Event Handling

### Module Subscribers

Modules that want to handle events must:

1. Create a subscriber class that implements `EventSubscriber`
2. Declare which events they handle via `getSubscribedEvents()`
3. Implement handlers for each event using `@OnEvent` decorator

Example:

```typescript
@Injectable()
export class NotificationSubscriber implements EventSubscriber {
  getSubscribedEvents(): EventSchema[] {
    return [
      UserEventSchemas.ACCOUNT_ACTIVATED,
      UserEventSchemas.PROFILE_UPDATED,
    ];
  }

  @OnEvent(UserEventSchemas.ACCOUNT_ACTIVATED.eventName)
  async handleAccountActivated(event: AccountActivatedSchema): Promise<void> {
    // Handle event
  }
}
```

## Event Versioning

Events follow semantic versioning:

- MAJOR: Breaking changes (schema changes)
- MINOR: Backwards compatible additions
- PATCH: Backwards compatible fixes

When making changes:

1. Update the schema version
2. Document changes in schema description
3. Update all consuming modules

## Best Practices

1. Event Names:
   - Use present tense for actions
   - Be specific about what happened
   - Follow the format: `{module}.{entity}.{action}`

2. Event Payload:
   - Include only necessary data
   - Use primitive types where possible
   - Include IDs rather than full objects
   - Make all properties readonly

3. Event Handling:
   - Keep handlers small and focused
   - Handle errors appropriately
   - Don't block the event loop
   - Log event processing

4. Event Evolution:
   - Plan for backwards compatibility
   - Consider event versioning early
   - Document breaking changes
   - Provide migration guides

## Example Workflow

1. Define Event Schema:

   ```typescript
   // src/common/event-bus/schemas/user.events.ts
   export const UserEventSchemas = {
     ACCOUNT_ACTIVATED: {
       eventName: 'user.account.activated',
       schema: {} as AccountActivatedSchema,
       version: '1.0.0',
       module: 'identity',
       description: 'Emitted when a user account is activated'
     }
   }
   ```

2. Implement Event:

   ```typescript
   // src/identity/events/account-activated.event.ts
   export class AccountActivatedEvent extends BaseEvent<AccountActivatedSchema> {
     constructor(userId: string, performedBy: string) {
       super(UserEventSchemas.ACCOUNT_ACTIVATED);
     }
   }
   ```

3. Create Subscriber:

   ```typescript
   // src/notification/notification.subscriber.ts
   export class NotificationSubscriber implements EventSubscriber {
     getSubscribedEvents() {
       return [UserEventSchemas.ACCOUNT_ACTIVATED];
     }

     @OnEvent(UserEventSchemas.ACCOUNT_ACTIVATED.eventName)
     async handleAccountActivated(event: AccountActivatedSchema) {
       await this.notificationService.sendWelcomeNotification(event.userId);
     }
   }
   ```

## Migration Guide

When migrating existing events to this system:

1. Create schema definitions for existing events
2. Update event implementations to use schemas
3. Update event handlers to use typed events
4. Test all event flows
5. Deploy changes gradually
