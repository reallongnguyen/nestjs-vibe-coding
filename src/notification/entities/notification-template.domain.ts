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
   * @param requiredVariables Optional array of variable names that must be present in the template
   * @returns True if the template is valid, false otherwise
   */
  validate(requiredVariables?: string[]): boolean {
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

      // Check for required variables if specified
      if (requiredVariables && requiredVariables.length > 0) {
        for (const variable of requiredVariables) {
          const variablePattern = new RegExp(
            `{{\\s*${variable}\\s*}}|{{\\s*${variable}\\.`,
          );
          if (!variablePattern.test(template)) {
            return false;
          }
        }
      }

      // Check for malformed Handlebars expressions
      const handlebarsExpressions = template.match(/{{[^{}]+}}/g) || [];
      for (const expr of handlebarsExpressions) {
        // Check for unclosed helpers (e.g., {{#if without {{/if}})
        if (
          expr.includes('#') &&
          !template.includes(`{{/${expr.match(/{{#(\w+)/)?.[1] || ''}}}`)
        ) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if the template has all required variables
   *
   * @param variables Array of variable names to check
   * @returns Object with missing variables for each language
   */
  checkRequiredVariables(
    variables: string[],
  ): Record<TemplateLanguage, string[]> {
    const result: Record<TemplateLanguage, string[]> = {} as Record<
      TemplateLanguage,
      string[]
    >;

    for (const [language, template] of Object.entries(this.content)) {
      const missingVariables: string[] = [];

      for (const variable of variables) {
        const variablePattern = new RegExp(
          `{{\\s*${variable}\\s*}}|{{\\s*${variable}\\.`,
        );
        if (!variablePattern.test(template)) {
          missingVariables.push(variable);
        }
      }

      if (missingVariables.length > 0) {
        result[language as TemplateLanguage] = missingVariables;
      }
    }

    return result;
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
