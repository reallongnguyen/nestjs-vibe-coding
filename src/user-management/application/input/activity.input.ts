import { UserActivityType } from '../../domain/entities/user-activity.entity';

export class CreateUserActivityInput {
  userId: string;
  activityType: UserActivityType;
  metadata?: Record<string, any>;
}
