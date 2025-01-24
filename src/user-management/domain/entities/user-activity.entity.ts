export enum UserActivityType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_COMPLETE = 'PASSWORD_RESET_COMPLETE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  ACCOUNT_DEACTIVATED = 'ACCOUNT_DEACTIVATED',
  ACCOUNT_ACTIVATED = 'ACCOUNT_ACTIVATED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
}

export class UserActivity {
  id: string;

  userId: string;

  activityType: UserActivityType;

  performedBy?: string; // ID of the user (usually admin) who performed the action

  details: Record<string, any>;

  timestamp: Date;

  ipAddress?: string;

  userAgent?: string;

  metadata?: Record<string, any>;

  constructor(partial: Partial<UserActivity>) {
    Object.assign(this, partial);
    this.timestamp = this.timestamp || new Date();
    this.details = this.details || {};
    this.metadata = this.metadata || {};
  }

  static createLoginActivity(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): UserActivity {
    return new UserActivity({
      userId,
      activityType: UserActivityType.LOGIN,
      ipAddress,
      userAgent,
      details: { timestamp: new Date() },
    });
  }

  static createProfileUpdateActivity(
    userId: string,
    changes: Record<string, any>,
    performedBy?: string,
  ): UserActivity {
    return new UserActivity({
      userId,
      activityType: UserActivityType.PROFILE_UPDATE,
      performedBy,
      details: { changes },
    });
  }

  static createRoleChangeActivity(
    userId: string,
    oldRoles: string[],
    newRoles: string[],
    performedBy: string,
  ): UserActivity {
    return new UserActivity({
      userId,
      activityType: UserActivityType.ROLE_CHANGE,
      performedBy,
      details: {
        oldRoles,
        newRoles,
      },
    });
  }

  static createAccountStatusActivity(
    userId: string,
    activityType:
      | UserActivityType.ACCOUNT_ACTIVATED
      | UserActivityType.ACCOUNT_DEACTIVATED
      | UserActivityType.ACCOUNT_DELETED,
    reason?: string,
    performedBy?: string,
  ): UserActivity {
    return new UserActivity({
      userId,
      activityType,
      performedBy,
      details: { reason },
    });
  }
}
