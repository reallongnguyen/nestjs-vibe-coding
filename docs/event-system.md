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

## Event Payload Design Principles

### Minimal Event Pattern

The system follows a "Minimal Event Pattern" where event publishers emit only essential identifying information, while event handlers enrich the data as needed. This design decision is based on several architectural considerations:

1. **Domain Boundaries**:
   - Publishers remain focused on their core domain
   - Event handlers maintain responsibility for domain-specific data enrichment
   - Clearer separation of concerns between modules

2. **Event Schema Design**:

   ```typescript
   // Example of a minimal event
   interface PostLikedEvent extends BaseEvent {
     data: {
       postId: string;    // Essential identifier
       actorId: string;   // Essential identifier
       timestamp: string; // Metadata
     }
   }
   ```

3. **Data Enrichment**:
   - Handlers are responsible for enriching events with domain-specific data
   - Can implement caching and optimization strategies
   - More flexible for future changes in data requirements

4. **Benefits**:
   - Loose coupling between modules
   - Smaller event payload size
   - More flexible for future changes
   - Other event consumers aren't burdened with unnecessary data

5. **Performance Considerations**:
   - Implement caching in event handlers
   - Use batch processing where appropriate
   - Optimize database queries for specific handler needs
   - Consider using data loader pattern for batching similar queries

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

## Planned Improvements

### Short-term Improvements

#### 1. Schema Registry Implementation

```typescript
// src/common/event-manager/core/domain/registry/event-schema.registry.ts
export class EventSchemaRegistry {
  private static schemas: Map<string, EventSchema> = new Map();
  private static versionMap: Map<string, string[]> = new Map();

  static register<T>(schema: EventSchema<T>): void {
    this.schemas.set(schema.eventName, schema);
    
    // Track versions
    const versions = this.versionMap.get(schema.eventName) || [];
    versions.push(schema.version);
    this.versionMap.set(schema.eventName, versions);
  }

  static getSchema(eventName: string): EventSchema | undefined {
    return this.schemas.get(eventName);
  }

  static getVersions(eventName: string): string[] {
    return this.versionMap.get(eventName) || [];
  }
}
```

Usage:

```typescript
// Register schema
EventSchemaRegistry.register(UserEventSchemas.ACCOUNT_ACTIVATED);

// Get schema in event handler
const schema = EventSchemaRegistry.getSchema('user.account.activated');
```

#### 2. Event Validation Enhancement

```typescript
// src/common/event-manager/core/domain/events/base.event.ts
export abstract class BaseEvent<T> implements EventBusMessage<T> {
  constructor(
    protected readonly schema: EventSchema<T>,
    protected readonly params?: EventMetadata,
  ) {
    this.eventId = uuidv7();
    this.eventName = schema.eventName;
    this.version = schema.version;
    this.metadata = this.buildMetadata(params);
    
    // Add validation
    this.validatePayload(this.toJSON());
  }

  protected validatePayload(data: T): void {
    const schema = EventSchemaRegistry.getSchema(this.eventName);
    if (!schema) {
      throw new Error(`No schema registered for event: ${this.eventName}`);
    }

    // Version compatibility check
    if (schema.version !== this.version) {
      throw new Error(
        `Event version mismatch. Expected ${schema.version}, got ${this.version}`,
      );
    }

    // Validate against JSON schema
    const ajv = new Ajv();
    const validate = ajv.compile(schema.jsonSchema);
    if (!validate(data)) {
      throw new Error(
        `Invalid event payload: ${JSON.stringify(validate.errors)}`,
      );
    }
  }
}
```

#### 3. Type-safe Event Handler Decorators

```typescript
// src/common/event-manager/adapters/decorators/typed-event.decorator.ts
export function OnTypedEvent<T>(schema: EventSchema<T>) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // Register schema
    EventSchemaRegistry.register(schema);

    // Apply NestJS event decorator
    OnEvent(schema.eventName)(target, propertyKey, descriptor);

    // Add runtime type checking
    const originalMethod = descriptor.value;
    descriptor.value = async function(...args: any[]) {
      const event = args[0];
      if (!(event instanceof BaseEvent)) {
        throw new Error('Event handler received invalid event type');
      }
      return originalMethod.apply(this, args);
    };
  };
}
```

Usage:

```typescript
@Injectable()
export class NotificationSubscriber {
  @OnTypedEvent(UserEventSchemas.ACCOUNT_ACTIVATED)
  async handleAccountActivated(event: AccountActivatedEvent) {
    // Type-safe event handling
  }
}
```

#### 4. Event Context Support

```typescript
// src/common/event-manager/core/domain/events/event.interface.ts
export interface EventContext {
  userId?: string;
  traceId: string;
  source: string;
  timestamp: number;
  environment: string;
}

export interface EventMetadata {
  correlationId?: string;
  context: EventContext;
  metadata?: Record<string, unknown>;
}
```

Implementation in BaseEvent:

```typescript
// src/common/event-manager/core/domain/events/base.event.ts
export abstract class BaseEvent<T> {
  protected buildMetadata(params?: EventMetadata): EventMetadata {
    return {
      correlationId: params?.correlationId || uuidv7(),
      context: {
        traceId: params?.context?.traceId || uuidv7(),
        source: params?.context?.source || this.constructor.name,
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'development',
        userId: params?.context?.userId,
      },
      metadata: params?.metadata || {},
    };
  }
}
```

### Implementation Steps

1. **Schema Registry (2 points)**
   - Create EventSchemaRegistry class
   - Add version tracking
   - Add schema validation utilities
   - Add tests for registry operations

2. **Event Validation (3 points)**
   - Enhance BaseEvent with validation
   - Add JSON schema validation
   - Add version compatibility checking
   - Add tests for validation scenarios

3. **Type-safe Decorators (2 points)**
   - Create OnTypedEvent decorator
   - Add runtime type checking
   - Add schema registration
   - Add tests for type safety

4. **Event Context (2 points)**
   - Add EventContext interface
   - Enhance EventMetadata
   - Update BaseEvent implementation
   - Add tests for context handling

### Medium-term Improvements

1. **Event Versioning and Migration**
   - Schema version management
   - Backward compatibility checks
   - Migration utilities
   - Version conflict resolution

2. **Event Monitoring**
   - Event metrics collection
   - Performance monitoring
   - Error tracking
   - Dashboard integration

3. **Event Replay**
   - Event storage
   - Replay mechanisms
   - State reconstruction
   - Consistency checks

### Long-term Improvements

1. **Message Broker Integration**
   - Message queue support
   - Distributed event processing
   - Event routing
   - Failure handling

2. **Event Streaming**
   - Stream processing
   - Real-time analytics
   - Event sourcing
   - CQRS implementation

3. **Schema Evolution**
   - Breaking change detection
   - Automated migration generation
   - Schema compatibility testing
   - Documentation generation
