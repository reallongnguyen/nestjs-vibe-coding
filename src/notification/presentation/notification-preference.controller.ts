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
  OkResponse,
  PaginatedResponse,
} from 'src/common';
import {
  GlobalErrorFilter,
  ErrorResponse,
  COMMON_ERRORS,
} from 'src/common/errors';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

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
@UseFilters(GlobalErrorFilter)
@ApiTags('notification-preferences')
@ErrorResponse(COMMON_ERRORS)
export class NotificationPreferenceController {
  constructor(
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  @Get()
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    summary: 'List notification preferences',
    description:
      'Get a list of notification preferences for the authenticated user',
  })
  @PaginatedResponse(NotificationPreferenceOutput)
  @ErrorResponse({})
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
      'Get a notification preference by type for the authenticated user',
  })
  @ApiParam({
    name: 'type',
    description: 'Notification type',
    enum: NotificationType,
  })
  @OkResponse(NotificationPreferenceOutput)
  @ErrorResponse({})
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
    description: 'Create a notification preference for the authenticated user',
  })
  @OkResponse(NotificationPreferenceOutput)
  @ErrorResponse({})
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
    description: 'Update a notification preference for the authenticated user',
  })
  @ApiParam({
    name: 'type',
    description: 'Notification type',
    enum: NotificationType,
  })
  @OkResponse(NotificationPreferenceOutput)
  @ErrorResponse({})
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
  @RequireAnyRoles(Role.ADMIN)
  @ApiOperation({
    summary: 'Update rate limit configuration',
    description: 'Update rate limit configuration for a notification type',
  })
  @ApiParam({
    name: 'type',
    description: 'Notification type',
    enum: NotificationType,
  })
  @OkResponse(NotificationPreferenceOutput)
  @ErrorResponse({})
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
