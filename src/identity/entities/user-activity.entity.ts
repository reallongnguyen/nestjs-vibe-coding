import {
  UserActivityType,
  UserActivity as PrismaUserActivity,
} from '@prisma/client';

export { UserActivityType };

export class UserActivity implements PrismaUserActivity {
  id: string;

  userId: string;

  activityType: UserActivityType;

  performedBy: string | null; // ID of the user (usually admin) who performed the action

  details: Record<string, any>;

  timestamp: Date;

  ipAddress: string | null;

  userAgent: string | null;

  metadata: Record<string, any> | null;

  success: boolean;
  location: string;
  deviceId: string;

  constructor(partial: Partial<UserActivity>) {
    Object.assign(this, partial);

    this.timestamp = this.timestamp || new Date();
    this.details = this.details || {};
    this.metadata = this.metadata || {};
    this.success = this.success ?? true;
    this.location = this.location || 'unknown';
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
    newRoles: string[],
    performedBy: string,
  ): UserActivity {
    return new UserActivity({
      userId,
      activityType: UserActivityType.ROLE_CHANGE,
      performedBy,
      details: {
        newRoles,
      },
    });
  }

  static createAccountStatusActivity(
    userId: string,
    activityType: UserActivityType,
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
