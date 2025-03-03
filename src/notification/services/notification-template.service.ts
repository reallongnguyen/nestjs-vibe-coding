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

    // Create a new version of the template
    const newTemplate = existingTemplate.createNewVersion();

    // Handle I18N content
    if (command.templateContent) {
      // Update content for each language provided
      for (const [lang, content] of Object.entries(command.templateContent)) {
        if (lang in TemplateLanguage) {
          newTemplate.setContent(lang as TemplateLanguage, content);
        }
      }
    } else {
      // Fallback to single template for Vietnamese
      newTemplate.setContent(TemplateLanguage.VI, command.template);
    }

    // Validate template syntax
    if (!newTemplate.validate()) {
      throw new AppError('notification.template.update.invalidSyntax');
    }

    const updatedTemplate = await this.templateRepository.create(newTemplate);

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
   * Clear template cache for a specific type
   * @param type Template type
   */
  private clearTemplateCache(type: string): void {
    // Clear Handlebars template cache
    for (const key of Array.from(this.templateCache.keys())) {
      if (key.startsWith(`${type}:`)) {
        this.templateCache.delete(key);
      }
    }

    this.logger.log(`Template cache cleared for type: ${type}`);
  }

  /**
   * Hot reload a template by type
   * This will clear the cache and reload the template from the database
   * @param type Template type
   * @returns True if reloaded, false if not found
   */
  async hotReloadTemplate(type: string): Promise<boolean> {
    try {
      // Get the template from the database
      const template = await this.templateRepository.findByType(type);
      if (!template) {
        this.logger.warn(`Template not found for hot reload: ${type}`);
        return false;
      }

      // Clear the cache
      this.clearTemplateCache(type);

      // Precompile templates for each language
      for (const [language, content] of Object.entries(template.content)) {
        const cacheKey = `${type}:${language}`;
        try {
          this.templateCache.set(cacheKey, Handlebars.compile(content));
        } catch (error) {
          this.logger.error(
            `Failed to compile template ${type} for language ${language}: ${error.message}`,
          );
          throw new AppError('notification.template.hotReload.compileError', {
            type,
            language,
            error: error.message,
          });
        }
      }

      this.logger.log(`Template hot reloaded: ${type}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to hot reload template ${type}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Validate template variables
   * @param template Template to validate
   * @param requiredVariables List of required variables
   * @returns Validation result with missing variables if any
   */
  validateTemplateVariables(
    template: NotificationTemplateDomain,
    requiredVariables: string[],
  ): {
    isValid: boolean;
    missingVariables?: Record<TemplateLanguage, string[]>;
  } {
    // Basic syntax validation
    if (!template.validate()) {
      return { isValid: false };
    }

    // Check for required variables
    const missingVariables = template.checkRequiredVariables(requiredVariables);
    const hasAllVariables = Object.keys(missingVariables).length === 0;

    return {
      isValid: hasAllVariables,
      missingVariables: hasAllVariables ? undefined : missingVariables,
    };
  }

  /**
   * Register Handlebars helpers
   */
  private registerHandlebarsHelpers(): void {
    // Helper for mathematical operations
    Handlebars.registerHelper('math', (lvalue, operator, rvalue) => {
      const parsedLvalue = parseFloat(lvalue);
      const parsedRvalue = parseFloat(rvalue);

      switch (operator) {
        case '+':
          return parsedLvalue + parsedRvalue;
        case '-':
          return parsedLvalue - parsedRvalue;
        case '*':
          return parsedLvalue * parsedRvalue;
        case '/':
          return parsedLvalue / parsedRvalue;
        case '%':
          return parsedLvalue % parsedRvalue;
        default:
          return parsedLvalue;
      }
    });

    // Helper for greater than comparison
    Handlebars.registerHelper('gt', (a, b) => {
      return a > b;
    });

    // Helper for less than comparison
    Handlebars.registerHelper('lt', (a, b) => {
      return a < b;
    });

    // Helper for equality comparison
    Handlebars.registerHelper('eq', (a, b) => {
      return a === b;
    });
  }
}
