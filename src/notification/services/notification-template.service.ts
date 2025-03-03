import { Inject, Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import {
  IEventBus,
  InjectEventBus,
  CreateNotificationTemplateCommand,
  UpdateNotificationTemplateCommand,
  AppError,
} from 'src/common';
import {
  NotificationTemplateCreatedEvent,
  NotificationTemplateDeletedEvent,
  NotificationTemplateUpdatedEvent,
} from 'src/common/event-bus/core/domain/events/notification.events';
import {
  NotificationTemplateDomain,
  TemplateLanguage,
} from '../entities/notification-template.domain';
import { INotificationTemplateRepository } from './interfaces/notification-template-repository.interface';

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
    return this.templateRepository.findAll();
  }

  /**
   * Get a notification template by ID
   * @param id Template ID
   * @returns Notification template
   * @throws NotFoundException if template not found
   */
  async getTemplateById(id: string): Promise<NotificationTemplateDomain> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new AppError('notification.template.get.notFound', {
        id,
      });
    }
    return template;
  }

  /**
   * Get a notification template by type
   * @param type Template type
   * @returns Notification template
   * @throws NotFoundException if template not found
   */
  async getTemplateByType(type: string): Promise<NotificationTemplateDomain> {
    const template = await this.templateRepository.findByType(type);
    if (!template) {
      throw new AppError('notification.template.get.notFound', {
        type,
      });
    }
    return template;
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
      throw new AppError('notification.template.create.invalidSyntax');
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
      throw new AppError('notification.template.update.invalidSyntax');
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
   * @returns Rendered template string
   * @throws NotFoundException if template not found
   */
  async renderTemplate(
    type: string,
    data: Record<string, any>,
    language: TemplateLanguage = TemplateLanguage.VI,
  ): Promise<string> {
    const template = await this.getTemplateByType(type);
    const templateContent = template.getContent(language);

    if (!templateContent) {
      throw new AppError('notification.template.render.notFound', {
        type,
        language,
      });
    }

    // Get or compile template
    let compiledTemplate = this.templateCache.get(`${type}_${language}`);
    if (!compiledTemplate) {
      try {
        compiledTemplate = Handlebars.compile(templateContent);
        this.templateCache.set(`${type}_${language}`, compiledTemplate);
      } catch (error) {
        this.logger.error(`Error compiling template ${type}: ${error.message}`);
        throw new AppError('notification.template.render.compileError', {
          type,
          language,
          error: error.message,
        });
      }
    }

    // Render template with data
    try {
      return compiledTemplate(data);
    } catch (error) {
      this.logger.error(`Error rendering template ${type}: ${error.message}`);
      throw new AppError('notification.template.render.renderError', {
        type,
        language,
        error: error.message,
      });
    }
  }

  /**
   * Hot reload a notification template
   * @param type Template type
   * @returns True if reloaded successfully
   * @throws AppError if template not found or compilation fails
   */
  async hotReloadTemplate(type: string): Promise<boolean> {
    try {
      const template = await this.getTemplateByType(type);

      // Clear cache for this template type
      this.clearTemplateCache(type);

      // Pre-compile templates for all languages to ensure they're valid
      for (const [language, content] of Object.entries(template.content)) {
        try {
          const compiledTemplate = Handlebars.compile(content);
          this.templateCache.set(`${type}_${language}`, compiledTemplate);
          this.logger.log(
            `Successfully reloaded template ${type} for language ${language}`,
          );
        } catch (error) {
          this.logger.error(
            `Error compiling template ${type} for language ${language}: ${error.message}`,
          );
          throw new AppError('notification.template.hotReload.compileError', {
            type,
            language,
          });
        }
      }

      return true;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }

      this.logger.error(`Error hot reloading template ${type}: ${err.message}`);
      throw new AppError('notification.template.hotReload.notFound', {
        type,
      });
    }
  }

  /**
   * Clear template cache for a specific type
   * @param type Template type
   */
  private clearTemplateCache(type: string): void {
    // Remove all cached templates for this type (all languages)
    for (const key of Array.from(this.templateCache.keys())) {
      if (key.startsWith(`${type}_`)) {
        this.templateCache.delete(key);
      }
    }
  }

  /**
   * Validate template variables against required variables
   * @param template Template to validate
   * @param requiredVariables Array of required variable names
   * @returns Validation result with missing variables if any
   */
  validateTemplateVariables(
    template: NotificationTemplateDomain,
    requiredVariables: string[],
  ): { isValid: boolean; missingVariables?: Record<string, string[]> } {
    const missingVariables = template.checkRequiredVariables(requiredVariables);

    // If no missing variables in any language, template is valid
    const isValid = Object.keys(missingVariables).length === 0;

    return {
      isValid,
      missingVariables: isValid ? undefined : missingVariables,
    };
  }

  /**
   * Register Handlebars helpers for template rendering
   */
  private registerHandlebarsHelpers(): void {
    // Helper for pluralization
    Handlebars.registerHelper(
      'plural',
      function (count: number, singular: string, plural: string) {
        return count === 1 ? singular : plural;
      },
    );

    // Helper for conditional text
    Handlebars.registerHelper(
      'ifCond',
      function (v1: any, operator: string, v2: any, options: any) {
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

    // Helper for greater than comparison
    Handlebars.registerHelper('gt', function (v1, v2) {
      return v1 > v2;
    });

    // Helper for math operations
    Handlebars.registerHelper('math', function (lvalue, operator, rvalue) {
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
