import { IBaseRepository } from 'src/common/repositories/base.repository.interface';
import { CreateDraftPostData } from '../dtos/create-daft-post.dto';
import { DraftPost } from '../../entities/draft-post.entity';
import { PublishedPost } from '../../entities/published-post.entity';

export interface IDraftPostRepository extends IBaseRepository {
  create(data: CreateDraftPostData): Promise<DraftPost>;
  findById(id: string): Promise<DraftPost | null>;
  update(id: string, data: Partial<CreateDraftPostData>): Promise<DraftPost>;
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
    },
  ): Promise<{ draft: DraftPost; published: PublishedPost }>;
}
