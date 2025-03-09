import { BaseEvent } from '../../../common/event-manager/entities/events/base.event';
import { EventMetadata } from '../../../common/event-manager/entities/events/event.interface';
import { IdentityEventSchemas } from '../../../common/event-manager/entities/events/schemas/identity.events';
import { User } from '../user.entity';
import { Role } from '../role.enum';

/**
 * Event emitted when a new user is created
 */
export class UserCreatedEvent extends BaseEvent<
  typeof IdentityEventSchemas.USER_CREATED.schema
> {
  private readonly eventPayload: typeof IdentityEventSchemas.USER_CREATED.schema;

  constructor(
    user: User,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(IdentityEventSchemas.USER_CREATED, params);
    this.eventPayload = {
      userId: user.id,
      authId: user.authId,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      roles: user.roles,
      isActive: user.isActive,
      email: user.email,
      phone: user.phone,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Event emitted when a user is updated
 */
export class UserUpdatedEvent extends BaseEvent<
  typeof IdentityEventSchemas.USER_UPDATED.schema
> {
  private readonly eventPayload: typeof IdentityEventSchemas.USER_UPDATED.schema;

  constructor(
    user: User,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(IdentityEventSchemas.USER_UPDATED, params);
    this.eventPayload = {
      userId: user.id,
      authId: user.authId,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      roles: user.roles,
      isActive: user.isActive,
      email: user.email,
      phone: user.phone,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Event emitted when a user's role is changed
 */
export class UserRoleChangedEvent extends BaseEvent<
  typeof IdentityEventSchemas.USER_ROLE_CHANGED.schema
> {
  private readonly eventPayload: typeof IdentityEventSchemas.USER_ROLE_CHANGED.schema;

  constructor(
    userId: string,
    roles: Role[],
    operatorId: string,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(IdentityEventSchemas.USER_ROLE_CHANGED, params);
    this.eventPayload = {
      userId,
      roles,
      operatorId,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Event emitted when a user is deactivated
 */
export class UserDeactivatedEvent extends BaseEvent<
  typeof IdentityEventSchemas.USER_DEACTIVATED.schema
> {
  private readonly eventPayload: typeof IdentityEventSchemas.USER_DEACTIVATED.schema;

  constructor(
    userId: string,
    operatorId: string,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(IdentityEventSchemas.USER_DEACTIVATED, params);
    this.eventPayload = {
      userId,
      operatorId,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Event emitted when a user is activated
 */
export class UserActivatedEvent extends BaseEvent<
  typeof IdentityEventSchemas.USER_ACTIVATED.schema
> {
  private readonly eventPayload: typeof IdentityEventSchemas.USER_ACTIVATED.schema;

  constructor(
    userId: string,
    operatorId: string,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(IdentityEventSchemas.USER_ACTIVATED, params);
    this.eventPayload = {
      userId,
      operatorId,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

/**
 * Event emitted when a user is deleted
 */
export class UserDeletedEvent extends BaseEvent<
  typeof IdentityEventSchemas.USER_DELETED.schema
> {
  private readonly eventPayload: typeof IdentityEventSchemas.USER_DELETED.schema;

  constructor(
    userId: string,
    operatorId: string,
    params?: Omit<EventMetadata, 'version' | 'timestamp'>,
  ) {
    super(IdentityEventSchemas.USER_DELETED, params);
    this.eventPayload = {
      userId,
      operatorId,
    };
  }

  toJSON() {
    return this.eventPayload;
  }
}

export { IdentityEventSchemas as USER_EVENTS } from '../../../common/event-manager/entities/events/schemas/identity.events';
