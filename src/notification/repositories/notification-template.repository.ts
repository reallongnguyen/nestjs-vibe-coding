import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  NotificationTemplateDomain,
  TemplateLanguage,
} from '../entities/notification-template.domain';
import { INotificationTemplateRepository } from '../services/interfaces/notification-template-repository.interface';

@Injectable()
export class NotificationTemplateRepository
  implements INotificationTemplateRepository
{
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all notification templates
   * @returns Array of notification templates
   */
  async findAll(): Promise<NotificationTemplateDomain[]> {
    const templates = await this.prisma.notificationTemplate.findMany({
      include: {
        contents: true,
      },
    });

    return templates.map(this.mapToDomain);
  }

  /**
   * Find a notification template by ID
   * @param id Template ID
   * @returns Notification template or null if not found
   */
  async findById(id: string): Promise<NotificationTemplateDomain | null> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { id },
      include: {
        contents: true,
      },
    });

    if (!template) {
      return null;
    }

    return this.mapToDomain(template);
  }

  /**
   * Find a notification template by type
   * @param type Template type
   * @returns Notification template or null if not found
   */
  async findByType(type: string): Promise<NotificationTemplateDomain | null> {
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { type },
      include: {
        contents: true,
      },
    });

    if (!template) {
      return null;
    }

    return this.mapToDomain(template);
  }

  /**
   * Create a new notification template
   * @param template Template to create
   * @returns Created template
   */
  async create(
    template: NotificationTemplateDomain,
  ): Promise<NotificationTemplateDomain> {
    // Extract content for each language
    const contentEntries = Object.entries(template.content).map(
      ([language, content]) => ({
        language: language as TemplateLanguage,
        content,
      }),
    );

    // Create template with contents
    const createdTemplate = await this.prisma.notificationTemplate.create({
      data: {
        name: template.name,
        type: template.type,
        version: template.version,
        isActive: template.isActive,
        contents: {
          create: contentEntries.map((entry) => ({
            language: entry.language,
            content: entry.content,
          })),
        },
      },
      include: {
        contents: true,
      },
    });

    return this.mapToDomain(createdTemplate);
  }

  /**
   * Update an existing notification template
   * @param id Template ID
   * @param template Template data to update
   * @returns Updated template
   */
  async update(
    id: string,
    template: Partial<NotificationTemplateDomain>,
  ): Promise<NotificationTemplateDomain> {
    // Get existing template to check what needs to be updated
    const existingTemplate = await this.findById(id);
    if (!existingTemplate) {
      throw new Error('Template not found');
    }

    // Prepare base update data
    const updateData: any = {};
    if (template.name) updateData.name = template.name;
    if (template.type) updateData.type = template.type;
    if (template.version) updateData.version = template.version;
    if (template.isActive !== undefined)
      updateData.isActive = template.isActive;

    // Update template
    const updatedTemplate = await this.prisma.notificationTemplate.update({
      where: { id },
      data: updateData,
      include: {
        contents: true,
      },
    });

    // Update contents if provided
    if (template.content) {
      // Delete existing contents and create new ones
      await this.prisma.notificationTemplateContent.deleteMany({
        where: { templateId: id },
      });

      // Create new contents
      const contentEntries = Object.entries(template.content).map(
        ([language, content]) => ({
          language: language as TemplateLanguage,
          content,
          templateId: id,
        }),
      );

      await this.prisma.notificationTemplateContent.createMany({
        data: contentEntries,
      });

      // Fetch updated template with contents
      const templateWithContents =
        await this.prisma.notificationTemplate.findUnique({
          where: { id },
          include: {
            contents: true,
          },
        });

      return this.mapToDomain(templateWithContents!);
    }

    return this.mapToDomain(updatedTemplate);
  }

  /**
   * Delete a notification template
   * @param id Template ID
   * @returns True if deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const template = await this.findById(id);
    if (!template) {
      return false;
    }

    await this.prisma.notificationTemplate.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Get active templates by types
   * @param types Array of template types
   * @returns Map of template types to templates
   */
  async getActiveTemplatesByTypes(
    types: string[],
  ): Promise<Map<string, NotificationTemplateDomain>> {
    const templates = await this.prisma.notificationTemplate.findMany({
      where: {
        type: { in: types },
        isActive: true,
      },
      include: {
        contents: true,
      },
    });

    const templateMap = new Map<string, NotificationTemplateDomain>();
    for (const template of templates.map(this.mapToDomain)) {
      templateMap.set(template.type, template);
    }

    return templateMap;
  }

  /**
   * Map a Prisma NotificationTemplate to a NotificationTemplateDomain
   * @param template Prisma NotificationTemplate with contents
   * @returns NotificationTemplateDomain
   */
  private mapToDomain(template: any): NotificationTemplateDomain {
    const domain = new NotificationTemplateDomain();
    domain.id = template.id;
    domain.name = template.name;
    domain.type = template.type;
    domain.version = template.version;
    domain.isActive = template.isActive;
    domain.createdAt = template.createdAt;
    domain.updatedAt = template.updatedAt;

    // Map contents to Record<TemplateLanguage, string>
    domain.content = {} as Record<TemplateLanguage, string>;
    for (const content of template.contents) {
      domain.content[content.language] = content.content;
    }

    return domain;
  }
}
