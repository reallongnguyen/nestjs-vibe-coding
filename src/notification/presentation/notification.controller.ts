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
  OkResponse,
  PaginatedResponse,
} from 'src/common';
import {
  GlobalErrorFilter,
  // ErrorResponse, // Removed
  // COMMON_ERRORS, // Removed
} from 'src/common/errors';
import { ApiAppErrors } from 'src/common/swagger/api-app-errors.decorator';
import { CommonErrorCode } from 'src/common/errors/common.error-codes';
import { NotificationErrorCode } from '../entities/errors/notification.error-codes';
import {
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

import {
  NotificationListQuery,
  NotificationOutput,
  NotificationPatchQuery,
} from './dtos/notification.dto';
import { RateLimitStatusDto } from './dtos/rate-limit.dto';
import { NotificationService } from '../services/notification.service';
import { NotificationRateLimitService } from '../services/notification-rate-limit.service';
import { RateLimitQuery } from '../entities/notification-preference.entity';
// import { NOTIFICATION_ERRORS } from '../entities/errors'; // Removed

@Controller({
  path: 'notifications',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ApiTags('notifications')
@ApiBearerAuth()
// @ErrorResponse(COMMON_ERRORS) // Removed
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly rateLimitService: NotificationRateLimitService,
  ) {}

  @Get()
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    summary: 'List notifications',
    description: 'Get a list of notifications for the authenticated user.',
  })
  @PaginatedResponse(NotificationOutput)
  // @ErrorResponse({}) // Removed
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    NotificationErrorCode.NOTIFICATION_CREATE_FAILED, // From service error handling
  ])
  async list(
    @AuthContextUser() user: User,
    @Query() query: NotificationListQuery,
  ): Promise<PagedResult<NotificationOutput>> {
    const { pageSize, pageNumber, includeViewed } = query;
    const limit = pageSize;
    const offset = pageNumber * pageSize;

    return this.notificationService.getNotificationsForUser(
      user.id,
      limit,
      offset,
      includeViewed,
    );
  }

  @Patch()
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    summary: 'Mark notifications as viewed',
    description:
      'Mark notifications as viewed for the authenticated user. If no id is provided, all notifications will be marked as viewed.',
  })
  @OkResponse(null)
  // @ErrorResponse({ // Removed
  //   NOTIFICATION_UPDATE_FAILED: NOTIFICATION_ERRORS.NOTIFICATION_UPDATE_FAILED,
  // })
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    NotificationErrorCode.NOTIFICATION_UPDATE_FAILED,
    NotificationErrorCode.NOTIFICATION_NOT_FOUND, // If a specific notification ID is not found
  ])
  async view(
    @AuthContextUser() user: User,
    @Query() query: NotificationPatchQuery,
  ): Promise<null> {
    await this.notificationService.view(user.id, query.id);
    return null;
  }

  @Get('unread/count')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    summary: 'Get unread count',
    description:
      'Get the count of unread notifications for the authenticated user.',
  })
  @OkResponse(null)
  // @ErrorResponse({}) // Removed
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    // No specific error code from service, but NOTIFICATION_NOT_FOUND could be used if user has no notifications record
    NotificationErrorCode.NOTIFICATION_NOT_FOUND,
  ])
  async getUnreadCount(
    @AuthContextUser() user: User,
  ): Promise<{ count: number }> {
    const count = await this.notificationService.getUnreadCount(user.id);
    return { count };
  }

  @Get('rate-limits')
  @RequireAnyRoles(Role.USER)
  @ApiQuery({ type: RateLimitQuery })
  @ApiOperation({
    summary: 'Get rate limit status',
    description: 'Get the rate limit status for notification types.',
  })
  @OkResponse(RateLimitStatusDto)
  // @ErrorResponse({}) // Removed
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    NotificationErrorCode.RATE_LIMIT_CHECK_FAILED, // If underlying service fails
  ])
  async getRateLimits(
    @AuthContextUser() user: User,
    @Query() query: RateLimitQuery,
  ): Promise<RateLimitStatusDto> {
    return this.rateLimitService.getRateLimitStatus(user.id, query.type);
  }

  @Post('rate-limits/override')
  @RequireAnyRoles(Role.ADMIN, Role.MODERATOR)
  @ApiQuery({ type: RateLimitQuery })
  @ApiOperation({
    summary: 'Override rate limits',
    description: 'Override rate limits for a notification type. Admin only.',
  })
  @OkResponse(null)
  // @ErrorResponse({}) // Removed
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    NotificationErrorCode.RATE_LIMIT_OVERRIDE_DISABLED,
    NotificationErrorCode.RATE_LIMIT_OVERRIDE_FAILED,
  ])
  async overrideRateLimits(
    @AuthContextUser() user: User,
    @Query() query: RateLimitQuery,
  ): Promise<void> {
    return this.rateLimitService.overrideRateLimit(user.id, query.type);
  }
}
