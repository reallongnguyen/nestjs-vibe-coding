import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EventSchema } from '../event.interface';
import { Role } from '../../../../../identity/entities/role.enum';

/**
 * Base payload for user events
 */
class BaseUserEventPayload {
  @IsUUID()
  userId: string;

  @IsString()
  authId: string;

  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

/**
 * Payload for user created event
 */
class UserCreatedPayload extends BaseUserEventPayload {}

/**
 * Payload for user updated event
 */
class UserUpdatedPayload extends BaseUserEventPayload {}

/**
 * Payload for user role changed event
 */
class UserRoleChangedPayload {
  @IsUUID()
  userId: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @IsUUID()
  operatorId: string;
}

/**
 * Payload for user deactivated event
 */
class UserDeactivatedPayload {
  @IsUUID()
  userId: string;

  @IsUUID()
  operatorId: string;
}

/**
 * Payload for user activated event
 */
class UserActivatedPayload {
  @IsUUID()
  userId: string;

  @IsUUID()
  operatorId: string;
}

/**
 * Payload for user deleted event
 */
class UserDeletedPayload {
  @IsUUID()
  userId: string;

  @IsUUID()
  operatorId: string;
}

/**
 * All identity related event schemas
 */
export const IdentityEventSchemas = {
  USER_CREATED: {
    eventName: 'identity.user.created',
    schema: new UserCreatedPayload(),
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a new user is created',
  } as EventSchema<UserCreatedPayload>,

  USER_UPDATED: {
    eventName: 'identity.user.updated',
    schema: new UserUpdatedPayload(),
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user is updated',
  } as EventSchema<UserUpdatedPayload>,

  USER_ROLE_CHANGED: {
    eventName: 'identity.user.role.changed',
    schema: new UserRoleChangedPayload(),
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user role is changed',
  } as EventSchema<UserRoleChangedPayload>,

  USER_DEACTIVATED: {
    eventName: 'identity.user.deactivated',
    schema: new UserDeactivatedPayload(),
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user is deactivated',
  } as EventSchema<UserDeactivatedPayload>,

  USER_ACTIVATED: {
    eventName: 'identity.user.activated',
    schema: new UserActivatedPayload(),
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user is activated',
  } as EventSchema<UserActivatedPayload>,

  USER_DELETED: {
    eventName: 'identity.user.deleted',
    schema: new UserDeletedPayload(),
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user is deleted',
  } as EventSchema<UserDeletedPayload>,
} as const;
