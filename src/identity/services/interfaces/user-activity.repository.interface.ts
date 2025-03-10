import { PagedResult } from 'src/common/models';

import { UserActivity } from '../../entities/user-activity.entity';
import { ActivityFiltersDto } from '../../presentation/dtos/activity-filters.input';

export interface IUserActivityRepository {
  findByUserId(
    userId: string,
    filters: ActivityFiltersDto,
  ): Promise<PagedResult<UserActivity>>;
  create(activity: Omit<UserActivity, 'id'>): Promise<UserActivity>;
}
