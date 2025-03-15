import { Inject, Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import {
  NotificationTemplateCreatedEvent,
  NotificationTemplateDeletedEvent,
  NotificationTemplateUpdatedEvent,
} from '../../common/event-manager/entities/events/notification.events';
import { IEventBus, InjectEventBus } from '../../common/event-manager';
import {
  CreateNotificationTemplateCommand,
  UpdateNotificationTemplateCommand,
} from '../../common';
import {
  NotificationTemplateDomain,
  TemplateLanguage,
} from '../entities/notification-template.domain';
import { INotificationTemplateRepository } from './interfaces/notification-template-repository.interface';
import { NotificationErrorFactory } from '../entities/errors';

/**
 * Service for managing notification templates
 */
@Injectable()
export class NotificationTemplateService {
  private readonly logger = new Logger(NotificationTemplateService.name);
  private readonly templateCache = new Map<
    string,
    HandlebarsTemplateDelegate<any>
  >();

  constructor(
    @Inject('INotificationTemplateRepository')
    private readonly templateRepository: INotificationTemplateRepository,
    @InjectEventBus() private readonly eventBus: IEventBus,
  ) {
    // Register Handlebars helpers
    this.registerHandlebarsHelpers();
  }

  /**
   * Get all notification templates
   * @returns Array of notification templates
   */
  async getAllTemplates(): Promise<NotificationTemplateDomain[]> {
    try {
      return await this.templateRepository.findAll();
    } catch (err) {
      this.logger.error(
        `Failed to get all templates: ${err.message}`,
        err.stack,
      );
      throw NotificationErrorFactory.notificationCreateFailed(
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }

  /**
   * Get a notification template by ID
   * @param id Template ID
   * @returns Notification template
   * @throws TemplateNotFoundError if template not found
   */
  async getTemplateById(id: string): Promise<NotificationTemplateDomain> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw NotificationErrorFactory.templateNotFound();
    }
    return template;
  }

  /**
   * Get a notification template by type
   * @param type Template type
   * @returns Notification template
   * @throws TemplateNotFoundError if template not found
   */
  async getTemplateByType(type: string): Promise<NotificationTemplateDomain> {
    try {
      const template = await this.templateRepository.findByType(type);
      if (!template) {
        throw NotificationErrorFactory.templateNotFound();
      }
      return template;
    } catch (err) {
      if (err.code === 'NOTIFICATION_TEMPLATE_NOT_FOUND') {
        throw err;
      }
      this.logger.error(
        `Failed to get template by type ${type}: ${err.message}`,
        err.stack,
      );
      throw NotificationErrorFactory.notificationCreateFailed(
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }

  /**
   * Create a new notification template
   * @param command Command with template data
   * @returns Created template
   */
  async createTemplate(
    command: CreateNotificationTemplateCommand,
  ): Promise<NotificationTemplateDomain> {
    const template = new NotificationTemplateDomain();
    template.name = command.name;
    template.type = command.type;

    // Handle I18N content
    if (command.templateContent) {
      template.content = {} as Record<TemplateLanguage, string>;

      // Add content for each language provided
      for (const [lang, content] of Object.entries(command.templateContent)) {
        if (lang in TemplateLanguage) {
          template.content[lang as TemplateLanguage] = content;
        }
      }

      // Ensure at least one language is set
      if (Object.keys(template.content).length === 0) {
        template.content = {
          [TemplateLanguage.VI]: command.template,
          [TemplateLanguage.EN]: command.template,
        };
      }
    } else {
      // Fallback to single template for all languages
      template.content = {
        [TemplateLanguage.VI]: command.template,
        [TemplateLanguage.EN]: command.template,
      };
    }

    template.version = command.version;
    template.isActive = true;

    // Validate template syntax
    if (!template.validate()) {
      throw NotificationErrorFactory.templateInvalidSyntax();
    }

    const createdTemplate = await this.templateRepository.create(template);

    // Clear cache for this template type
    this.clearTemplateCache(template.type);

    // Publish template created event
    await this.eventBus.publish(
      new NotificationTemplateCreatedEvent(
        createdTemplate.id,
        createdTemplate.type,
        createdTemplate.name,
        createdTemplate.version,
      ),
    );

    return createdTemplate;
  }

  /**
   * Update an existing notification template
   * @param command Command with template data
   * @returns Updated template
   * @throws NotFoundException if template not found
   */
  async updateTemplate(
    command: UpdateNotificationTemplateCommand,
  ): Promise<NotificationTemplateDomain> {
    const existingTemplate = await this.getTemplateById(command.templateId);

    // Create a partial template with updates
    const templateUpdate: Partial<NotificationTemplateDomain> = {
      version: command.version,
    };

    // Handle I18N content
    if (command.templateContent) {
      const contentUpdate: Partial<Record<TemplateLanguage, string>> = {};

      // Update content for each language provided
      for (const [lang, content] of Object.entries(command.templateContent)) {
        if (lang in TemplateLanguage) {
          contentUpdate[lang as TemplateLanguage] = content;
        }
      }

      // Only set content if we have updates
      if (Object.keys(contentUpdate).length > 0) {
        // Merge with existing content to ensure all languages are present
        templateUpdate.content = {
          ...existingTemplate.content,
          ...contentUpdate,
        };
      }
    } else if (command.template) {
      // Fallback to single template for Vietnamese
      templateUpdate.content = {
        ...existingTemplate.content,
        [TemplateLanguage.VI]: command.template,
      };
    }

    // Validate template syntax
    const tempTemplate = new NotificationTemplateDomain();
    tempTemplate.content = templateUpdate.content || existingTemplate.content;
    if (!tempTemplate.validate()) {
      throw NotificationErrorFactory.templateInvalidSyntax();
    }

    // Update the existing template
    const updatedTemplate = await this.templateRepository.update(
      command.templateId,
      templateUpdate,
    );

    // Clear cache for this template type
    this.clearTemplateCache(updatedTemplate.type);

    // Publish template updated event
    await this.eventBus.publish(
      new NotificationTemplateUpdatedEvent(
        updatedTemplate.id,
        updatedTemplate.type,
        updatedTemplate.name,
        updatedTemplate.version,
      ),
    );

    return updatedTemplate;
  }

  /**
   * Delete a notification template
   * @param id Template ID
   * @returns True if deleted, false otherwise
   * @throws NotFoundException if template not found
   */
  async deleteTemplate(id: string): Promise<boolean> {
    const template = await this.getTemplateById(id);
    const result = await this.templateRepository.delete(id);

    // Clear cache for this template type
    this.clearTemplateCache(template.type);

    // Publish template deleted event
    if (result) {
      await this.eventBus.publish(
        new NotificationTemplateDeletedEvent(template.id, template.type),
      );
    }

    return result;
  }

  /**
   * Render a notification template with data
   * @param type Template type
   * @param data Data to render the template with
   * @param language Language to render the template in
   * @returns Rendered template
   * @throws AppError if template not found or rendering fails
   */
  async renderTemplate(
    type: string,
    data: Record<string, any>,
    language: TemplateLanguage = TemplateLanguage.VI,
  ): Promise<string> {
    // Try to get from cache first
    const cacheKey = `${type}:${language}`;
    let template = this.templateCache.get(cacheKey);

    // If not in cache, load from database and compile
    if (!template) {
      const templateDomain = await this.templateRepository.findByType(type);
      if (!templateDomain) {
        this.logger.error(`Template not found: ${type}`);
        throw NotificationErrorFactory.templateNotFound();
      }

      const templateContent = templateDomain.getContent(language);
      if (!templateContent) {
        this.logger.error(
          `Template content not found for language: ${language}`,
        );

        // Try to fall back to another language if available
        const availableLanguages = Object.keys(templateDomain.content);
        if (availableLanguages.length > 0) {
          const fallbackLanguage = availableLanguages[0] as TemplateLanguage;
          this.logger.log(`Falling back to language: ${fallbackLanguage}`);

          const fallbackContent = templateDomain.getContent(fallbackLanguage);
          if (fallbackContent) {
            try {
              template = Handlebars.compile(fallbackContent);
              this.templateCache.set(cacheKey, template);
            } catch (compileError) {
              this.logger.error(
                `Error compiling fallback template: ${compileError.message}`,
              );
              throw NotificationErrorFactory.templateRenderError(
                type,
                fallbackLanguage,
                compileError instanceof Error
                  ? compileError
                  : new Error(String(compileError)),
              );
            }
          }
        }

        if (!template) {
          throw NotificationErrorFactory.templateRenderError(
            type,
            language,
            new Error('Template content not found'),
          );
        }
      } else {
        try {
          template = Handlebars.compile(templateContent);
          this.templateCache.set(cacheKey, template);
        } catch (compileError) {
          this.logger.error(
            `Error compiling template: ${compileError.message}`,
          );
          throw NotificationErrorFactory.templateRenderError(
            type,
            language,
            compileError instanceof Error
              ? compileError
              : new Error(String(compileError)),
          );
        }
      }
    }

    // Render the template with data
    try {
      return template(data);
    } catch (renderError) {
      this.logger.error(`Error rendering template: ${renderError.message}`);

      // Clear cache in case the template is invalid
      this.templateCache.delete(cacheKey);

      throw NotificationErrorFactory.templateRenderError(
        type,
        language,
        renderError instanceof Error
          ? renderError
          : new Error(String(renderError)),
      );
    }
  }

  /**
   * Validate a template for syntax errors and required variables
   * @param template Template to validate
   * @param requiredVariables Optional array of variable names that must be present in the template
   * @returns Validation result with detailed information
   */
  validateTemplateVariables(
    template: NotificationTemplateDomain,
    requiredVariables: string[],
  ): { isValid: boolean; missingVariables?: Record<string, string[]> } {
    // Check if template has content
    if (!template?.content || Object.keys(template.content).length === 0) {
      return {
        isValid: false,
        missingVariables: { general: ['Template content is missing'] },
      };
    }

    // Check for required variables in each language
    const missingVariables = template.checkRequiredVariables(requiredVariables);
    const hasAllVariables = Object.keys(missingVariables).length === 0;

    // Validate template syntax
    const syntaxValid = template.validate();

    if (!syntaxValid) {
      return {
        isValid: false,
        missingVariables: {
          ...missingVariables,
          syntax: ['Template contains syntax errors'],
        },
      };
    }

    return {
      isValid: hasAllVariables && syntaxValid,
      missingVariables: hasAllVariables ? undefined : missingVariables,
    };
  }

  /**
   * Hot reload a template by type
   * This method clears the template cache and forces a reload from the database
   * @param type Template type
   * @returns True if template was reloaded, false otherwise
   */
  async hotReloadTemplate(type: string): Promise<boolean> {
    this.logger.log(`Hot reloading template: ${type}`);

    try {
      // Clear the template cache
      this.clearTemplateCache(type);

      // Reload the template from the database
      const template = await this.templateRepository.findByType(type);
      if (!template) {
        this.logger.warn(`Template not found for hot reload: ${type}`);
        return false;
      }

      // Pre-compile the template for each language
      for (const [lang, content] of Object.entries(template.content)) {
        try {
          const compiledTemplate = Handlebars.compile(content);
          const cacheKey = `${type}:${lang}`;
          this.templateCache.set(cacheKey, compiledTemplate);
          this.logger.log(`Template reloaded and compiled: ${cacheKey}`);
        } catch (error) {
          this.logger.error(
            `Error compiling template ${type} for language ${lang}:`,
            error,
          );
          // Continue with other languages even if one fails
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Error hot reloading template ${type}:`, error);
      return false;
    }
  }

  /**
   * Clear the template cache for a specific type
   * @param type Template type
   */
  private clearTemplateCache(type: string): void {
    // Find all cache keys for this template type
    const keysToRemove: string[] = [];

    this.templateCache.forEach((_, key) => {
      if (key.startsWith(`${type}:`)) {
        keysToRemove.push(key);
      }
    });

    // Remove all matching keys
    keysToRemove.forEach((key) => {
      this.templateCache.delete(key);
      this.logger.log(`Cleared template cache for: ${key}`);
    });
  }

  /**
   * Register Handlebars helpers for template rendering
   */
  private registerHandlebarsHelpers(): void {
    // Helper for pluralization
    Handlebars.registerHelper(
      'plural',
      (count: number, singular: string, plural: string) => {
        return count === 1 ? singular : plural;
      },
    );

    // Helper for conditional text
    Handlebars.registerHelper(
      'ifCond',
      (v1: any, operator: string, v2: any, options: any) => {
        switch (operator) {
          case '==':
            return v1 === v2 ? options.fn(this) : options.inverse(this);
          case '===':
            return v1 === v2 ? options.fn(this) : options.inverse(this);
          case '!=':
            return v1 !== v2 ? options.fn(this) : options.inverse(this);
          case '!==':
            return v1 !== v2 ? options.fn(this) : options.inverse(this);
          case '<':
            return v1 < v2 ? options.fn(this) : options.inverse(this);
          case '<=':
            return v1 <= v2 ? options.fn(this) : options.inverse(this);
          case '>':
            return v1 > v2 ? options.fn(this) : options.inverse(this);
          case '>=':
            return v1 >= v2 ? options.fn(this) : options.inverse(this);
          default:
            return options.inverse(this);
        }
      },
    );

    Handlebars.registerHelper(
      'fullName',
      (
        person:
          | {
              name?: string;
              fullName?: string;
              firstName?: string;
              lastName?: string;
              language?: string;
            }
          | string,
      ) => {
        if (typeof person === 'string') {
          return person;
        }

        if (person.fullName) {
          return person.fullName;
        }

        if (person.name) {
          return person.name;
        }

        if (person.language === 'VI') {
          return [person.lastName, person.firstName]
            .filter(Boolean)
            .join(' ')
            .trim();
        }

        return [person.firstName, person.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();
      },
    );

    Handlebars.registerHelper(
      'firstName',
      (
        person:
          | {
              name?: string;
              fullName?: string;
              firstName?: string;
              language?: string;
            }
          | string,
      ) => {
        if (typeof person === 'string') {
          return person;
        }

        if (person.fullName) {
          return person.fullName;
        }

        if (person.name) {
          return person.name;
        }

        return person.firstName;
      },
    );

    // Helper for greater than comparison
    Handlebars.registerHelper('gt', (v1: number, v2: number) => {
      return v1 > v2;
    });

    // Helper for math operations
    Handlebars.registerHelper('math', (lvalue, operator, rvalue) => {
      const left = parseFloat(lvalue);
      const right = parseFloat(rvalue);

      switch (operator) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          return left / right;
        case '%':
          return left % right;
        default:
          return left;
      }
    });
  }
}
