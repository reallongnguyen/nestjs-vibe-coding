import { Collection } from 'src/common/models';

import { UserActivity } from '../../entities/user-activity.entity';
import { ActivityFiltersDto } from '../../presentation/rest/input/activity-filters.dto';

export interface UserActivityRepositoryPort {
  findByUserId(
    userId: string,
    filters: ActivityFiltersDto,
  ): Promise<Collection<UserActivity>>;
  create(activity: UserActivity): Promise<UserActivity>;
}
