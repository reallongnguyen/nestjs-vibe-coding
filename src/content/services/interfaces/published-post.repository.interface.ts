import { IBaseRepository } from 'src/common/repositories/base.repository.interface';
import { Collection } from 'src/common/models';
import {
  PublishedPost,
  PublishedPostWithAuthor,
} from '../../entities/published-post.entity';
import { ListPostsQueryDto } from '../../presentation/dtos/list-posts.dto';

export interface IPublishedPostRepository extends IBaseRepository {
  findById(id: string): Promise<PublishedPost | null>;
  delete(id: string): Promise<void>;
  findAll(
    query: ListPostsQueryDto,
  ): Promise<Collection<PublishedPostWithAuthor>>;
}
