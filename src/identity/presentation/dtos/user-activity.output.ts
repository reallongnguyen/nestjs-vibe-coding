import { ApiProperty } from '@nestjs/swagger';
import { UserActivityType } from 'src/generated/client';

import { UserActivity } from '../../entities/user-activity.entity';

export class UserActivityDto {
  @ApiProperty({ example: '018fb0ab-f1e3-7bd7-961c-8b14b479a718' })
  id: string;

  @ApiProperty({ example: '018fb0ab-f1e3-7bd7-961c-8b14b479a710' })
  userId: string;

  @ApiProperty({ example: '018fb0ab-f1e3-7bd7-961c-8b14b479a711' })
  performedBy?: string;

  @ApiProperty({ example: UserActivityType.ACCOUNT_ACTIVATED })
  activityType: string;

  @ApiProperty({ example: { timestamp: new Date() } })
  details: Record<string, any>;

  @ApiProperty({ example: new Date() })
  timestamp: Date;

  static fromApplication(activity: UserActivity): UserActivityDto {
    return {
      id: activity.id,
      userId: activity.userId,
      performedBy: activity.performedBy,
      activityType: activity.activityType,
      details: activity.details,
      timestamp: activity.timestamp,
    };
  }
}
