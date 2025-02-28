import { LikeOperation } from '../../repositories/like.repository';

/**
 * Repository interface for like operations
 */
export interface ILikeRepository {
  /**
   * Batch update like counts
   * @param items Array of like operations
   */
  batchUpdateLikeCount(items: LikeOperation[]): Promise<void>;
}
