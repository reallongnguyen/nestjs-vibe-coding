import { EventSchema } from '../event.interface';

/**
 * Schema for account activation event
 */
interface AccountActivatedSchema {
  userId: string;
  performedBy: string;
  timestamp: number;
}

/**
 * Schema for account deactivation event
 */
interface AccountDeactivatedSchema {
  userId: string;
  performedBy: string;
  reason?: string;
  timestamp: number;
}

/**
 * Schema for profile update event
 */
interface ProfileUpdatedSchema {
  id: string;
  name: string;
  avatar?: string;
  timestamp: number;
  updatedFields: string[];
}

/**
 * Schema for role change event
 */
interface RoleChangeSchema {
  userId: string;
  newRoles: string[];
  oldRoles: string[];
  performedBy: string;
  timestamp: number;
  spaceId?: string;
}

/**
 * Schema for user activity event
 */
interface UserActivitySchema {
  userId: string;
  activityType: string;
  activityData: Record<string, unknown>;
  timestamp: number;
}

/**
 * Schema for space member role change event
 */
interface SpaceMemberRoleChangeSchema {
  userId: string;
  spaceId: string;
  newRole: string;
  oldRole: string;
  performedBy: string;
  timestamp: number;
}

/**
 * Schema for account deletion event
 */
interface AccountDeletedSchema {
  userId: string;
  performedBy: string;
  timestamp: number;
}

/**
 * All identity related event schemas
 */
export const IdentityEventSchemas = {
  ACCOUNT_ACTIVATED: {
    eventName: 'identity.account.activated',
    schema: {} as AccountActivatedSchema,
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user account is activated',
  } as EventSchema<AccountActivatedSchema>,

  ACCOUNT_DEACTIVATED: {
    eventName: 'identity.account.deactivated',
    schema: {} as AccountDeactivatedSchema,
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user account is deactivated',
  } as EventSchema<AccountDeactivatedSchema>,

  PROFILE_UPDATED: {
    eventName: 'identity.profile.updated',
    schema: {} as ProfileUpdatedSchema,
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user profile is updated',
  } as EventSchema<ProfileUpdatedSchema>,

  ROLE_CHANGED: {
    eventName: 'identity.role.changed',
    schema: {} as RoleChangeSchema,
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user roles are changed',
  } as EventSchema<RoleChangeSchema>,

  USER_ACTIVITY: {
    eventName: 'identity.user.activity',
    schema: {} as UserActivitySchema,
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user performs a tracked activity',
  } as EventSchema<UserActivitySchema>,

  SPACE_MEMBER_ROLE_CHANGED: {
    eventName: 'identity.space.member.role.changed',
    schema: {} as SpaceMemberRoleChangeSchema,
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user role in a space is changed',
  } as EventSchema<SpaceMemberRoleChangeSchema>,

  ACCOUNT_DELETED: {
    eventName: 'identity.account.deleted',
    schema: {} as AccountDeletedSchema,
    version: '1.0.0',
    module: 'identity',
    description: 'Emitted when a user account is deleted',
  } as EventSchema<AccountDeletedSchema>,
} as const;
