import {
  Controller,
  Get,
  Patch,
  Query,
  UseFilters,
  UseGuards,
  Post,
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
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';

import {
  NotificationListQuery,
  NotificationOutput,
  NotificationPatchQuery,
} from './dtos/notification.dto';
import { RateLimitStatusDto } from './dtos/rate-limit.dto';
import { NotificationService } from '../services/notification.service';
import { notificationErrorMap } from '../entities/notification-error.map';
import { NotificationRateLimitService } from '../services/notification-rate-limit.service';
import { RateLimitQuery } from '../entities/notification-preference.entity';

@Controller({
  path: 'notifications',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(notificationErrorMap))
@ApiTags('notifications')
@ErrorResponse('common', notificationErrorMap)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly rateLimitService: NotificationRateLimitService,
  ) {}

  @Get()
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    summary: 'List up notifications belong to a user',
    description:
      'Return paginated notifications that belong to the authenticated user',
  })
  @PaginatedResponse(NotificationOutput)
  @ErrorResponse('notification.list', notificationErrorMap)
  async list(
    @AuthContextUser() user: User,
    @Query() query: NotificationListQuery,
  ): Promise<PagedResult<NotificationOutput>> {
    const { skip, take, includeViewed } = query.toDatabaseQuery();

    // Use the optimized method for better performance
    return this.notificationService.getNotificationsForUser(
      user.id,
      take,
      skip,
      includeViewed,
    );
  }

  @Patch('view')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    summary: 'Mark all notifications as viewed',
    description:
      'Mark all notifications that belong to authenticated user as viewed. If you want to mask a notification, you may add a query "id=<notification id>"',
  })
  @OkResponse(null)
  @ErrorResponse('notification.view', notificationErrorMap)
  async view(
    @AuthContextUser() user: User,
    @Query() query: NotificationPatchQuery,
  ): Promise<null> {
    await this.notificationService.view(user.id, query.id);

    return null;
  }

  /**
   * Get rate limit status for the current user
   * @param user Authenticated user
   * @param type Notification type
   * @returns Rate limit status
   */
  @Get('rate-limits')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Get rate limit status for the current user' })
  @ApiQuery({
    name: 'type',
    required: true,
    description: 'Notification type to check rate limits for',
  })
  @OkResponse(RateLimitStatusDto)
  @ErrorResponse('notification.getRateLimit', notificationErrorMap)
  async getRateLimits(
    @AuthContextUser() user: User,
    @Query() query: RateLimitQuery,
  ): Promise<RateLimitStatusDto> {
    const status = await this.rateLimitService.getRateLimitStatus(
      user.id,
      query.type,
    );

    return RateLimitStatusDto.fromDomain(status);
  }

  /**
   * Override rate limits for the current user
   * Only works if overrides are enabled in configuration
   * @param user Authenticated user
   * @param type Notification type
   * @returns Success status
   */
  @Post('rate-limits/override')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({ summary: 'Override rate limits for the current user' })
  @OkResponse(null)
  @ErrorResponse('notification.setRateLimit', notificationErrorMap)
  async overrideRateLimits(
    @AuthContextUser() user: User,
    @Query() query: RateLimitQuery,
  ): Promise<void> {
    await this.rateLimitService.overrideRateLimit(user.id, query.type);
  }
}
