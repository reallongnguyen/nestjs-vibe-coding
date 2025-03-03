import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequireAnyRoles, AuthGuard, RolesGuard } from 'src/common';
import { UserRole } from '@prisma/client';
import { NotificationTemplateService } from '../services/notification-template.service';
import { CreateNotificationTemplateDto } from './dtos/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dtos/update-notification-template.dto';
import { NotificationTemplateDto } from './dtos/notification-template.dto';

@ApiTags('notification-templates')
@Controller('notifications/templates')
@UseGuards(AuthGuard, RolesGuard)
export class NotificationTemplateController {
  constructor(private readonly templateService: NotificationTemplateService) {}

  @Get()
  @RequireAnyRoles(UserRole.ADMIN, UserRole.ROOT)
  @ApiOperation({ summary: 'Get all notification templates' })
  @ApiResponse({
    status: 200,
    description: 'List of notification templates',
    type: [NotificationTemplateDto],
  })
  async getAllTemplates(): Promise<NotificationTemplateDto[]> {
    const templates = await this.templateService.getAllTemplates();
    return templates.map((template) =>
      NotificationTemplateDto.fromDomain(template),
    );
  }

  @Get(':id')
  @RequireAnyRoles(UserRole.ADMIN, UserRole.ROOT)
  @ApiOperation({ summary: 'Get a notification template by ID' })
  @ApiResponse({
    status: 200,
    description: 'The notification template',
    type: NotificationTemplateDto,
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplateById(
    @Param('id') id: string,
  ): Promise<NotificationTemplateDto> {
    const template = await this.templateService.getTemplateById(id);
    return NotificationTemplateDto.fromDomain(template);
  }

  @Post()
  @RequireAnyRoles(UserRole.ADMIN, UserRole.ROOT)
  @ApiOperation({ summary: 'Create a new notification template' })
  @ApiResponse({
    status: 201,
    description: 'The notification template has been created',
    type: NotificationTemplateDto,
  })
  async createTemplate(
    @Body() createDto: CreateNotificationTemplateDto,
  ): Promise<NotificationTemplateDto> {
    const template = await this.templateService.createTemplate({
      name: createDto.name,
      type: createDto.type,
      template: createDto.content[Object.keys(createDto.content)[0]] || '',
      templateContent: createDto.content as Record<string, string>,
      version: createDto.version,
      description: createDto.description,
    });
    return NotificationTemplateDto.fromDomain(template);
  }

  @Put(':id')
  @RequireAnyRoles(UserRole.ADMIN, UserRole.ROOT)
  @ApiOperation({ summary: 'Update a notification template' })
  @ApiResponse({
    status: 200,
    description: 'The notification template has been updated',
    type: NotificationTemplateDto,
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationTemplateDto,
  ): Promise<NotificationTemplateDto> {
    const template = await this.templateService.updateTemplate({
      templateId: id,
      template: updateDto.content[Object.keys(updateDto.content)[0]] || '',
      templateContent: updateDto.content as Record<string, string>,
      version: updateDto.version,
      description: updateDto.description,
    });
    return NotificationTemplateDto.fromDomain(template);
  }

  @Delete(':id')
  @RequireAnyRoles(UserRole.ADMIN, UserRole.ROOT)
  @ApiOperation({ summary: 'Delete a notification template' })
  @ApiResponse({
    status: 200,
    description: 'The notification template has been deleted',
  })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async deleteTemplate(@Param('id') id: string): Promise<{ success: boolean }> {
    const result = await this.templateService.deleteTemplate(id);
    return { success: result };
  }
}
