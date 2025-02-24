import { IBaseRepository } from 'src/common/repositories/base.repository.interface';
import { CreateDraftPostData } from '../dtos/create-daft-post.dto';
import { DraftPost } from '../../entities/draft-post.entity';

export interface IDraftPostRepository extends IBaseRepository {
  create(data: CreateDraftPostData): Promise<DraftPost>;
  findById(id: string): Promise<DraftPost | null>;
  update(id: string, data: Partial<CreateDraftPostData>): Promise<DraftPost>;
}
