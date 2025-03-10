import { IBaseRepository } from 'src/common/repositories/base.repository.interface';
import { PagedResult } from 'src/common/models';
import { CreateDraftPostData } from '../dtos/create-daft-post.dto';
import { DraftPost } from '../../entities/draft-post.entity';
import { PublishedPost } from '../../entities/published-post.entity';
import { ListDraftPostsQueryDto } from '../../presentation/dtos/list-posts.dto';

export interface IDraftPostRepository extends IBaseRepository {
  create(data: CreateDraftPostData): Promise<DraftPost>;
  findById(id: string): Promise<DraftPost | null>;
  update(id: string, data: Partial<CreateDraftPostData>): Promise<DraftPost>;
  delete(id: string): Promise<void>;
  publish(
    id: string,
    data: {
      title?: string;
      subtitle?: string;
      content: Record<string, any>;
      excerpt?: string;
      slug: string;
      readingTime: number;
      userId: string;
      cover: string;
      topicIds: string[];
    },
  ): Promise<{ published: PublishedPost }>;
  applyToPublished(
    id: string,
    publishedId: string,
    data: {
      title?: string;
      subtitle?: string;
      content: Record<string, any>;
      excerpt?: string;
      readingTime: number;
      userId: string;
      cover: string;
      topicIds: string[];
    },
  ): Promise<{ published: PublishedPost }>;
  findByPublishedId(publishedId: string): Promise<DraftPost | null>;
  findAll(
    userId: string,
    query: ListDraftPostsQueryDto,
  ): Promise<PagedResult<DraftPost>>;
}
