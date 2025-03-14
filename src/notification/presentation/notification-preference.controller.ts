import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  AuthContextUser,
  AuthGuard,
  RequireAnyRoles,
  Role,
  RolesGuard,
  User,
  PagedResult,
  ErrorResponse,
  OkResponse,
  PaginatedResponse,
  RestExceptionFilter,
} from 'src/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { notificationErrorMap } from '../entities/notification-error.map';
import { NotificationPreferenceService } from '../services/notification-preference.service';
import { NotificationType } from '../entities/notification-preference.entity';
import {
  CreateNotificationPreferenceDto,
  NotificationPreferenceListQuery,
  NotificationPreferenceOutput,
  UpdateNotificationPreferenceDto,
  UpdateRateLimitConfigDto,
} from './dtos/notification-preference.dto';

@Controller({
  path: 'notifications/preferences',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(notificationErrorMap))
@ApiTags('notification-preferences')
@ErrorResponse('common', notificationErrorMap)
export class NotificationPreferenceController {
  constructor(
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  @Get()
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    summary: 'List notification preferences',
    description:
      'Return paginated notification preferences for the authenticated user',
  })
  @PaginatedResponse(NotificationPreferenceOutput)
  @ErrorResponse('notification.preference.list', notificationErrorMap)
  async list(
    @AuthContextUser() user: User,
    @Query() query: NotificationPreferenceListQuery,
  ): Promise<PagedResult<NotificationPreferenceOutput>> {
    const preferences = await this.preferenceService.getPreferences(
      user.id,
      query,
    );

    return PagedResult.transform(
      preferences,
      NotificationPreferenceOutput.fromDomain,
    );
  }

  @Get(':type')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    summary: 'Get notification preference by type',
    description:
      'Return a specific notification preference by type for the authenticated user',
  })
  @ApiParam({
    name: 'type',
    enum: NotificationType,
    description: 'Notification type',
  })
  @OkResponse(NotificationPreferenceOutput)
  @ErrorResponse('notification.preference.get', notificationErrorMap)
  async getByType(
    @AuthContextUser() user: User,
    @Param('type') type: NotificationType,
  ): Promise<NotificationPreferenceOutput> {
    const preference = await this.preferenceService.getPreferenceByType(
      user.id,
      type,
    );

    return NotificationPreferenceOutput.fromDomain(preference);
  }

  @Post()
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    summary: 'Create notification preference',
    description:
      'Create a new notification preference for the authenticated user',
  })
  @OkResponse(NotificationPreferenceOutput)
  @ErrorResponse('notification.preference.create', notificationErrorMap)
  async create(
    @AuthContextUser() user: User,
    @Body() dto: CreateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceOutput> {
    const preference = await this.preferenceService.createPreference(
      user.id,
      dto.type,
      dto.channels,
      dto.enabled,
    );

    return NotificationPreferenceOutput.fromDomain(preference);
  }

  @Put(':type')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    summary: 'Update notification preference',
    description:
      'Update an existing notification preference for the authenticated user',
  })
  @ApiParam({
    name: 'type',
    enum: NotificationType,
    description: 'Notification type',
  })
  @OkResponse(NotificationPreferenceOutput)
  @ErrorResponse('notification.preference.update', notificationErrorMap)
  async update(
    @AuthContextUser() user: User,
    @Param('type') type: NotificationType,
    @Body() dto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceOutput> {
    const preference = await this.preferenceService.updatePreference(
      user.id,
      type,
      {
        channels: dto.channels,
        enabled: dto.enabled,
      },
    );

    return NotificationPreferenceOutput.fromDomain(preference);
  }

  @Put(':type/rate-limits')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    summary: 'Update rate limit configuration',
    description:
      'Update rate limit configuration for a notification preference',
  })
  @ApiParam({
    name: 'type',
    enum: NotificationType,
    description: 'Notification type',
  })
  @OkResponse(NotificationPreferenceOutput)
  @ErrorResponse('notification.rateLimit.update', notificationErrorMap)
  async updateRateLimits(
    @AuthContextUser() user: User,
    @Param('type') type: NotificationType,
    @Body() dto: UpdateRateLimitConfigDto,
  ): Promise<NotificationPreferenceOutput> {
    const preference = await this.preferenceService.updateRateLimitConfig(
      user.id,
      type,
      dto,
    );

    return NotificationPreferenceOutput.fromDomain(preference);
  }
}
