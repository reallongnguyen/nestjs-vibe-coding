import { PageOptionsDto } from 'src/common/presentation/dtos/page-options.dto';
import { Comment, CommentWithAuthor } from '../../entities/comment.entity';

/**
 * Repository interface for comment operations
 */
export interface ICommentRepository {
  /**
   * Create a new comment
   * @param data Comment creation data
   */
  create(data: {
    content: string;
    postId: string;
    userId: string;
    parentId?: string;
  }): Promise<Comment>;

  /**
   * Find a comment by its ID
   * @param id Comment ID
   */
  findById(id: string): Promise<CommentWithAuthor | null>;

  /**
   * Find comments for a post
   * @param postId ID of the post
   * @param pageOptions Pagination parameters
   */
  findByPost(
    postId: string,
    pageOptions: PageOptionsDto,
  ): Promise<[CommentWithAuthor[], number]>;

  /**
   * Update a comment
   * @param id Comment ID
   * @param data Update data
   */
  update(id: string, data: { content: string }): Promise<Comment>;

  /**
   * Delete a comment
   * @param id Comment ID
   */
  delete(id: string): Promise<void>;
}
