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
import {
  RequireAnyRoles,
  AuthGuard,
  RolesGuard,
  Role,
  OkResponse,
  ErrorResponse,
} from 'src/common';
import { NotificationTemplateService } from '../services/notification-template.service';
import {
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
  NotificationTemplateDto,
} from './dtos';
import { TemplateLanguage } from '../entities/notification-template.domain';
import { notificationErrorMap } from '../entities/notification-error.map';
import {
  ValidateTemplateDto,
  ValidationResultDto,
} from './dtos/validate-template.dto';
import {
  TestRenderTemplateDto,
  TestRenderResultDto,
} from './dtos/test-render-template.dto';

@ApiTags('notification-templates')
@Controller({
  path: 'notifications/templates',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
export class NotificationTemplateController {
  constructor(private readonly templateService: NotificationTemplateService) {}

  @Get()
  @RequireAnyRoles(Role.ADMIN, Role.ROOT)
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
  @RequireAnyRoles(Role.ADMIN, Role.ROOT)
  @ApiOperation({ summary: 'Get a notification template by ID' })
  @OkResponse(NotificationTemplateDto)
  @ErrorResponse('notification.template.get', notificationErrorMap)
  async getTemplateById(
    @Param('id') id: string,
  ): Promise<NotificationTemplateDto> {
    const template = await this.templateService.getTemplateById(id);
    return NotificationTemplateDto.fromDomain(template);
  }

  @Post()
  @RequireAnyRoles(Role.ADMIN, Role.ROOT)
  @ApiOperation({ summary: 'Create a new notification template' })
  @OkResponse(NotificationTemplateDto)
  @ErrorResponse('notification.template.create', notificationErrorMap)
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
  @RequireAnyRoles(Role.ADMIN, Role.ROOT)
  @ApiOperation({ summary: 'Update a notification template' })
  @OkResponse(NotificationTemplateDto)
  @ErrorResponse('notification.template.update', notificationErrorMap)
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
  @RequireAnyRoles(Role.ADMIN, Role.ROOT)
  @ApiOperation({ summary: 'Delete a notification template' })
  @OkResponse(null)
  @ErrorResponse('notification.template.delete', notificationErrorMap)
  async deleteTemplate(@Param('id') id: string): Promise<null> {
    await this.templateService.deleteTemplate(id);
    return null;
  }

  @Post(':id/hot-reload')
  @RequireAnyRoles(Role.ADMIN, Role.ROOT)
  @ApiOperation({ summary: 'Hot reload a notification template' })
  @OkResponse(null)
  @ErrorResponse('notification.template.hotReload', notificationErrorMap)
  async hotReloadTemplate(@Param('id') id: string): Promise<void> {
    const template = await this.templateService.getTemplateById(id);
    await this.templateService.hotReloadTemplate(template.type);
  }

  @Post(':id/validate')
  @RequireAnyRoles(Role.ADMIN, Role.ROOT)
  @ApiOperation({ summary: 'Validate a notification template' })
  @OkResponse(ValidationResultDto)
  @ErrorResponse('notification.template.validate', notificationErrorMap)
  async validateTemplate(
    @Param('id') id: string,
    @Body() body: ValidateTemplateDto,
  ): Promise<ValidationResultDto> {
    const template = await this.templateService.getTemplateById(id);
    return this.templateService.validateTemplateVariables(
      template,
      body.requiredVariables,
    );
  }

  @Post(':id/test-render')
  @RequireAnyRoles(Role.ADMIN, Role.ROOT)
  @ApiOperation({ summary: 'Test render a notification template' })
  @OkResponse(TestRenderResultDto)
  @ErrorResponse('notification.template.testRender', notificationErrorMap)
  async testRenderTemplate(
    @Param('id') id: string,
    @Body() body: TestRenderTemplateDto,
  ): Promise<TestRenderResultDto> {
    const template = await this.templateService.getTemplateById(id);
    const result: Record<TemplateLanguage, string> = {} as Record<
      TemplateLanguage,
      string
    >;

    if (body.language) {
      try {
        // Render for specific language
        const rendered = await this.templateService.renderTemplate(
          template.type,
          body.data,
          body.language,
        );
        result[body.language] = rendered;
      } catch (error) {
        result[body.language] = `Error: ${error.message}`;
      }
    } else {
      // Render for all available languages
      const languages = Object.keys(template.content) as TemplateLanguage[];

      // Use Promise.all to avoid await in loop
      const renderPromises = languages.map(async (language) => {
        try {
          const rendered = await this.templateService.renderTemplate(
            template.type,
            body.data,
            language,
          );
          return { language, rendered };
        } catch (error) {
          return { language, rendered: `Error: ${error.message}` };
        }
      });

      const renderResults = await Promise.all(renderPromises);

      // Populate the result object
      for (const { language, rendered } of renderResults) {
        result[language] = rendered;
      }
    }

    return { rendered: result };
  }

  @Get('types')
  @RequireAnyRoles(Role.ADMIN, Role.ROOT)
  @ApiOperation({ summary: 'Get all notification template types' })
  @ApiResponse({
    status: 200,
    description: 'List of template types',
    schema: {
      type: 'object',
      properties: {
        types: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getTemplateTypes(): Promise<{ types: string[] }> {
    const templates = await this.templateService.getAllTemplates();
    const types = [...new Set(templates.map((t) => t.type))];
    return { types };
  }
}
