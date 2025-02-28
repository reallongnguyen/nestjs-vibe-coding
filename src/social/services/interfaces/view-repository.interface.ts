import { ViewOperation } from '../../repositories/view.repository';

/**
 * Repository interface for view operations
 */
export interface IViewRepository {
  /**
   * Insert a view record
   * @param contentId Content ID
   * @param contentType Content type
   * @param viewerHash Viewer hash
   * @param viewerId Viewer ID
   */
  insertView(
    contentId: string,
    contentType: string,
    viewerHash: string,
    viewerId?: string,
  ): Promise<{ isNewView: boolean }>;

  /**
   * Batch insert view records
   * @param items View operations
   */
  batchInsertView(items: ViewOperation[]): Promise<void>;
}
