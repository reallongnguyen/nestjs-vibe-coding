import { UserActivityType } from '../../entities/user-activity.entity';

export class CreateUserActivityInput {
  userId: string;
  activityType: UserActivityType;
  metadata?: Record<string, any>;
}
