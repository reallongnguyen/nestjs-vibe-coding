import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthContextUser,
  AuthGuard,
  RequireAnyRoles,
  Role,
  RolesGuard,
  User,
  OkResponse,
  PaginatedResponse,
} from 'src/common';
import {
  GlobalErrorFilter,
  ErrorResponse,
  COMMON_ERRORS,
} from 'src/common/errors';

import { NotificationTemplateService } from '../services/notification-template.service';
import {
  CreateTemplateDto,
  NotificationTemplateOutput,
  NotificationTemplateListQuery,
  PagedTemplateResult,
  RenderTemplateDto,
  UpdateTemplateDto,
  ValidateTemplateDto,
} from './dtos/notification-template.dto';
import { NOTIFICATION_ERRORS } from '../entities/errors';

@Controller({ path: 'notifications/templates', version: '1' })
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ApiTags('notification-templates')
@ApiBearerAuth()
@ErrorResponse(COMMON_ERRORS)
export class NotificationTemplateController {
  constructor(private readonly templateService: NotificationTemplateService) {}

  @Get()
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({
    summary: 'List notification templates',
    description: 'Get a list of notification templates with pagination',
  })
  @PaginatedResponse(NotificationTemplateOutput)
  @ErrorResponse({})
  async list(
    @AuthContextUser() user: User,
    @Query() query: NotificationTemplateListQuery,
  ): Promise<PagedTemplateResult> {
    const templates = await this.templateService.getAllTemplates();
    // Convert to paged result format
    return {
      items: templates.map(NotificationTemplateOutput.fromDomain),
      total: templates.length,
      page: query.pageNumber || 0,
      pageSize: query.pageSize || 10,
    };
  }

  @Get(':id')
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get notification template',
    description: 'Get a notification template by ID',
  })
  @OkResponse(NotificationTemplateOutput)
  @ErrorResponse({ TEMPLATE_NOT_FOUND: NOTIFICATION_ERRORS.TEMPLATE_NOT_FOUND })
  async getById(
    @AuthContextUser() user: User,
    @Param('id') id: string,
  ): Promise<NotificationTemplateOutput> {
    const template = await this.templateService.getTemplateById(id);
    return NotificationTemplateOutput.fromDomain(template);
  }

  @Post()
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({
    summary: 'Create notification template',
    description: 'Create a new notification template',
  })
  @OkResponse(NotificationTemplateOutput)
  @ErrorResponse({
    TEMPLATE_INVALID_SYNTAX: NOTIFICATION_ERRORS.TEMPLATE_INVALID_SYNTAX,
  })
  async create(
    @AuthContextUser() user: User,
    @Body() dto: CreateTemplateDto,
  ): Promise<NotificationTemplateOutput> {
    const template = await this.templateService.createTemplate({
      name: dto.type,
      type: dto.type,
      template: dto.body,
      templateContent: { [dto.language]: dto.body },
      version: '1.0.0',
      description: dto.description,
    });
    return NotificationTemplateOutput.fromDomain(template);
  }

  @Put(':id')
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update notification template',
    description: 'Update an existing notification template',
  })
  @OkResponse(NotificationTemplateOutput)
  @ErrorResponse({
    TEMPLATE_INVALID_SYNTAX: NOTIFICATION_ERRORS.TEMPLATE_INVALID_SYNTAX,
  })
  async update(
    @AuthContextUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ): Promise<NotificationTemplateOutput> {
    const template = await this.templateService.updateTemplate({
      templateId: id,
      template: dto.body || '',
      version: 'updated',
      description: dto.description,
    });
    return NotificationTemplateOutput.fromDomain(template);
  }

  @Delete(':id')
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete notification template',
    description: 'Delete a notification template',
  })
  @OkResponse(null)
  @ErrorResponse({ TEMPLATE_NOT_FOUND: NOTIFICATION_ERRORS.TEMPLATE_NOT_FOUND })
  async delete(
    @AuthContextUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    await this.templateService.deleteTemplate(id);
  }

  @Post(':id/compile')
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({
    summary: 'Compile notification template',
    description: 'Compile (hot reload) a notification template',
  })
  @OkResponse(NotificationTemplateOutput)
  @ErrorResponse({ TEMPLATE_NOT_FOUND: NOTIFICATION_ERRORS.TEMPLATE_NOT_FOUND })
  async compile(
    @AuthContextUser() user: User,
    @Param('id') id: string,
  ): Promise<NotificationTemplateOutput> {
    // TODO: This would need to be implemented in the service
    // For now, we'll just return the template
    const template = await this.templateService.getTemplateById(id);
    return NotificationTemplateOutput.fromDomain(template);
  }

  @Post(':id/validate')
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({
    summary: 'Validate notification template',
    description: 'Validate a notification template with sample data',
  })
  @OkResponse(null)
  @ErrorResponse({})
  async validate(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @AuthContextUser() _user: User,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Param('id') _id: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() _dto: ValidateTemplateDto,
  ): Promise<{ valid: boolean; errors?: string[] }> {
    // TODO: This would need to be implemented in the service
    // For now, just return a simple result
    return { valid: true };
  }

  @Post(':id/render')
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({
    summary: 'Test render notification template',
    description: 'Render a notification template with sample data',
  })
  @OkResponse(null)
  @ErrorResponse({})
  async render(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @AuthContextUser() _user: User,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Param('id') _id: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() _dto: RenderTemplateDto,
  ): Promise<{ title: string; body: string }> {
    // TODO: This would need to be implemented in the service
    // For now, return dummy data
    return { title: 'Rendered Title', body: 'Rendered Body with data' };
  }
}
