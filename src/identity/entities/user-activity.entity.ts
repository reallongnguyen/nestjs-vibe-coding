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
}
