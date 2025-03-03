/**
 * Notification Template Domain Model
 *
 * This file contains the domain model for notification templates following DDD principles.
 */

/**
 * Supported languages for notification templates
 */
export enum TemplateLanguage {
  EN = 'EN',
  VI = 'VI',
}

/**
 * Notification Template Domain Model
 *
 * Represents a template for generating notification content
 */
export class NotificationTemplateDomain {
  /**
   * Unique identifier for the template
   */
  id: string;

  /**
   * Name of the template for administrative purposes
   */
  name: string;

  /**
   * Type of notification this template is for
   */
  type: string;

  /**
   * Template content with Handlebars syntax
   */
  content: Record<TemplateLanguage, string>;

  /**
   * Template version for tracking changes
   */
  version: string;

  /**
   * Whether this template is active
   */
  isActive: boolean;

  /**
   * When the template was created
   */
  createdAt: Date;

  /**
   * When the template was last updated
   */
  updatedAt: Date;

  /**
   * Get the template content for a specific language
   *
   * @param language The language to get the template for
   * @returns The template content or undefined if not available
   */
  getContent(language: TemplateLanguage): string | undefined {
    return this.content[language];
  }

  /**
   * Set the template content for a specific language
   *
   * @param language The language to set the template for
   * @param content The template content
   */
  setContent(language: TemplateLanguage, content: string): void {
    this.content[language] = content;
    this.updatedAt = new Date();
  }

  /**
   * Validate the template content for syntax errors
   *
   * @returns True if the template is valid, false otherwise
   */
  validate(): boolean {
    // Check if at least one language is defined
    if (Object.keys(this.content).length === 0) {
      return false;
    }

    // Check each language template for basic Handlebars syntax
    for (const template of Object.values(this.content)) {
      // Check for unbalanced opening/closing tags
      const openTags = (template.match(/{{/g) || []).length;
      const closeTags = (template.match(/}}/g) || []).length;
      if (openTags !== closeTags) {
        return false;
      }

      // Check for unbalanced decorator tags
      const openDecorators = (template.match(/<d\s/g) || []).length;
      const closeDecorators = (template.match(/<\/d>/g) || []).length;
      if (openDecorators !== closeDecorators) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create a new version of this template
   *
   * @returns A new template with incremented version
   */
  createNewVersion(): NotificationTemplateDomain {
    const newTemplate = new NotificationTemplateDomain();

    // Copy properties
    newTemplate.name = this.name;
    newTemplate.type = this.type;
    newTemplate.content = { ...this.content };

    // Increment version
    const versionParts = this.version.split('.');
    const lastPart = parseInt(versionParts[versionParts.length - 1], 10);
    versionParts[versionParts.length - 1] = (lastPart + 1).toString();
    newTemplate.version = versionParts.join('.');

    newTemplate.isActive = false;
    newTemplate.createdAt = new Date();
    newTemplate.updatedAt = new Date();

    return newTemplate;
  }
}
