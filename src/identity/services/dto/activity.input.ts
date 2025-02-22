import { UserActivityType } from '../../entities/user-activity.entity';

export class CreateUserActivityInput {
  userId: string;
  activityType: UserActivityType;
  performedBy: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  location?: string;
  deviceId?: string;
  metadata?: Record<string, any>;
}
