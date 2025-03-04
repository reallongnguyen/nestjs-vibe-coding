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
  @OkResponse(Boolean)
  @ErrorResponse('notification.template.hotReload', notificationErrorMap)
  async hotReloadTemplate(
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const template = await this.templateService.getTemplateById(id);
    const success = await this.templateService.hotReloadTemplate(template.type);
    return { success };
  }

  @Post('hot-reload-all')
  @RequireAnyRoles(Role.ADMIN, Role.ROOT)
  @ApiOperation({ summary: 'Hot reload all notification templates' })
  @OkResponse(Boolean)
  @ErrorResponse('notification.template.hotReload', notificationErrorMap)
  async hotReloadAllTemplates(): Promise<{
    success: boolean;
    reloadedCount: number;
  }> {
    const templates = await this.templateService.getAllTemplates();

    // Use Promise.all to avoid await in a loop
    const reloadResults = await Promise.all(
      templates.map((template) =>
        this.templateService.hotReloadTemplate(template.type),
      ),
    );

    // Count successful reloads
    const reloadedCount = reloadResults.filter((success) => success).length;

    return {
      success: reloadedCount > 0,
      reloadedCount,
    };
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

    // Perform basic syntax validation
    const syntaxValid = template.validate();

    // Validate required variables if provided
    const variableValidation = this.templateService.validateTemplateVariables(
      template,
      body.requiredVariables || [],
    );

    // Test render with sample data if provided
    const renderResults: Record<
      string,
      { success: boolean; result?: string; error?: string }
    > = {};

    if (body.sampleData && Object.keys(body.sampleData).length > 0) {
      const languages = Object.keys(template.content);

      // Use Promise.all to avoid await in a loop
      const renderPromises = languages.map(async (lang) => {
        try {
          const rendered = await this.templateService.renderTemplate(
            template.type,
            body.sampleData,
            lang as TemplateLanguage,
          );
          return { lang, success: true, result: rendered };
        } catch (error) {
          return {
            lang,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      // Process all render results
      const results = await Promise.all(renderPromises);

      // Add results to the renderResults object
      for (const result of results) {
        const { lang, ...rest } = result;
        renderResults[lang] = rest;
      }
    }

    return {
      syntaxValid,
      variablesValid: variableValidation.isValid,
      missingVariables: variableValidation.missingVariables,
      renderResults:
        Object.keys(renderResults).length > 0 ? renderResults : undefined,
    };
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
    const results: Record<
      string,
      { rendered: string; success: boolean; error?: string }
    > = {};

    // Get languages to render
    const languages =
      body.languages && body.languages.length > 0
        ? body.languages
        : Object.keys(template.content).map((lang) => lang as TemplateLanguage);

    // Render for each language
    await Promise.all(
      languages.map(async (lang) => {
        try {
          if (template.content[lang]) {
            const rendered = await this.templateService.renderTemplate(
              template.type,
              body.data,
              lang as TemplateLanguage,
            );
            results[lang] = { rendered, success: true };
          } else {
            results[lang] = {
              rendered: '',
              success: false,
              error: `Language ${lang} not available in template`,
            };
          }
        } catch (error) {
          results[lang] = {
            rendered: '',
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    return {
      templateId: id,
      templateType: template.type,
      results,
    };
  }

  @Get('types')
  @RequireAnyRoles(Role.ADMIN, Role.ROOT)
  @ApiOperation({ summary: 'Get all notification template types' })
  @OkResponse(Object)
  async getTemplateTypes(): Promise<{ types: string[] }> {
    const templates = await this.templateService.getAllTemplates();
    const types = templates.map((template) => template.type);
    return { types: [...new Set(types)] }; // Return unique types
  }
}
