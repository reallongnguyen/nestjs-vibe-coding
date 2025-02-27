import { Collection } from 'src/common/models';
import { PaginationQueryDto } from 'src/common/presentation/dtos/pagination-query.dto';
import { CommentOutput } from '../../services/dtos/comment.output';

/**
 * Interface for content that can be commented on
 */
export interface ICommentable {
  /**
   * Add a comment to the content
   * @param userId ID of the user creating the comment
   * @param content Comment content
   * @param parentId Optional parent comment ID for replies
   */
  comment(
    userId: string,
    content: string,
    parentId?: string,
  ): Promise<CommentOutput>;

  /**
   * Get comments for the content
   * @param options Pagination options
   */
  getComments(options: PaginationQueryDto): Promise<Collection<CommentOutput>>;

  /**
   * Get total comment count
   */
  getCommentCount(): Promise<number>;
}
