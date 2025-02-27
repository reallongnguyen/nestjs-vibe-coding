/**
 * Interface for content that can be viewed
 */
export interface IViewable {
  /**
   * Record a view of the content
   * @param viewerHash Hash identifying the viewer
   * @param viewerId Optional ID of the authenticated viewer
   */
  view(viewerHash: string, viewerId?: string): Promise<void>;

  /**
   * Get total view count
   */
  getViewCount(): Promise<number>;
}
