import { ApiProperty } from '@nestjs/swagger';

import { UserActivity } from '../../../../../core/domain/entities/user-activity.entity';

export class UserActivityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  activityType: string;

  @ApiProperty()
  details: Record<string, any>;

  @ApiProperty()
  timestamp: Date;

  static fromApplication(activity: UserActivity): UserActivityDto {
    return {
      id: activity.id,
      userId: activity.userId,
      activityType: activity.activityType,
      details: activity.details,
      timestamp: activity.timestamp,
    };
  }
}
