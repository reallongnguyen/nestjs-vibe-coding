import { IBaseRepository } from 'src/common/repositories/base.repository.interface';
import { Topic } from '../../entities/topic.entity';

export interface ITopicRepository extends IBaseRepository {
  findManyByIds(ids: string[]): Promise<Topic[]>;
}
