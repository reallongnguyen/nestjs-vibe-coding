import { IBaseRepository } from 'src/common/repositories/base.repository.interface';
import { PublishedPost } from '../../entities/published-post.entity';

export interface IPublishedPostRepository extends IBaseRepository {
  findById(id: string): Promise<PublishedPost | null>;
  delete(id: string): Promise<void>;
}
