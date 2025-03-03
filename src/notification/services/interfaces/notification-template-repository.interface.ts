import { NotificationTemplateDomain } from '../../entities/notification-template.domain';

/**
 * Interface for notification template repository
 * Defines the contract for interacting with notification templates
 */
export interface INotificationTemplateRepository {
  /**
   * Find all notification templates
   * @returns Array of notification templates
   */
  findAll(): Promise<NotificationTemplateDomain[]>;

  /**
   * Find a notification template by ID
   * @param id Template ID
   * @returns Notification template or null if not found
   */
  findById(id: string): Promise<NotificationTemplateDomain | null>;

  /**
   * Find a notification template by type
   * @param type Template type
   * @returns Notification template or null if not found
   */
  findByType(type: string): Promise<NotificationTemplateDomain | null>;

  /**
   * Create a new notification template
   * @param template Template to create
   * @returns Created template
   */
  create(
    template: NotificationTemplateDomain,
  ): Promise<NotificationTemplateDomain>;

  /**
   * Update an existing notification template
   * @param id Template ID
   * @param template Template data to update
   * @returns Updated template
   */
  update(
    id: string,
    template: Partial<NotificationTemplateDomain>,
  ): Promise<NotificationTemplateDomain>;

  /**
   * Delete a notification template
   * @param id Template ID
   * @returns True if deleted, false otherwise
   */
  delete(id: string): Promise<boolean>;

  /**
   * Get active templates by types
   * @param types Array of template types
   * @returns Map of template types to templates
   */
  getActiveTemplatesByTypes(
    types: string[],
  ): Promise<Map<string, NotificationTemplateDomain>>;
}
