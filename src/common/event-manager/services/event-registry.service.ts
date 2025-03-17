import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { validateSync } from 'class-validator';
import { EventSchema } from '../entities/events/event.interface';
import { EventValidationError } from '../entities/errors/event.errors';
import { ContentEventSchemas } from '../entities/events/schemas/content.events';
import { GamificationEventSchemas } from '../entities/events/schemas/gamification.events';
import { IdentityEventSchemas } from '../entities/events/schemas/identity.events';
import { InvitationEventSchemas } from '../entities/events/schemas/invitation.events';
import { SocialEventSchemas } from '../entities/events/schemas/social.events';

/**
 * Service for managing event type registration and validation
 * Provides type safety and runtime validation for event schemas
 */
@Injectable()
export class EventRegistryService implements OnModuleInit {
  private readonly logger = new Logger(EventRegistryService.name);
  private readonly registry = new Map<string, EventSchema<object>>();

  /**
   * Initialize event registry with built-in event schemas
   */
  onModuleInit() {
    // Register content events
    this.registerEventSchemas(
      ContentEventSchemas as Record<string, EventSchema<object>>,
    );

    // Register gamification events
    this.registerEventSchemas(
      GamificationEventSchemas as Record<string, EventSchema<object>>,
    );

    // Register identity events
    this.registerEventSchemas(
      IdentityEventSchemas as Record<string, EventSchema<object>>,
    );

    // Register social events
    this.registerEventSchemas(
      SocialEventSchemas as Record<string, EventSchema<object>>,
    );

    // Register invitation events
    this.registerEventSchemas(
      InvitationEventSchemas as Record<string, EventSchema<object>>,
    );

    this.logger.log(`Registered ${this.registry.size} event types`);
  }

  /**
   * Register multiple event schemas
   */
  private registerEventSchemas(
    schemas: Record<string, EventSchema<object>>,
  ): void {
    Object.values(schemas).forEach((schema) => {
      this.registerEventType(schema);
    });
  }

  /**
   * Register a new event type schema
   * @throws EventValidationError if schema is invalid
   */
  registerEventType<T extends object>(schema: EventSchema<T>): void {
    // Validate schema structure
    if (!schema.eventName || !schema.schema || !schema.version) {
      throw new EventValidationError('Invalid event schema structure', []);
    }

    // Validate schema using class-validator
    const errors = validateSync(schema.schema as object);
    if (errors.length > 0) {
      throw new EventValidationError(
        `Invalid event schema for ${schema.eventName}`,
        errors,
      );
    }

    // Check for duplicate event names
    if (this.registry.has(schema.eventName)) {
      throw new EventValidationError(
        `Event type ${schema.eventName} already registered`,
        [],
      );
    }

    this.registry.set(schema.eventName, schema);
    this.logger.debug(
      `Registered event type ${schema.eventName} (v${schema.version})`,
    );
  }

  /**
   * Get event schema by name
   */
  getEventSchema<T extends object>(
    eventName: string,
  ): EventSchema<T> | undefined {
    const schema = this.registry.get(eventName);
    return schema ? (schema as EventSchema<T>) : undefined;
  }

  /**
   * Check if event type is registered
   */
  hasEventType(eventName: string): boolean {
    return this.registry.has(eventName);
  }

  /**
   * Get all registered event types
   */
  getAllEventTypes(): EventSchema<object>[] {
    return Array.from(this.registry.values());
  }

  /**
   * Get event types by module
   */
  getEventTypesByModule(module: string): EventSchema<object>[] {
    return this.getAllEventTypes().filter((schema) => schema.module === module);
  }
}
