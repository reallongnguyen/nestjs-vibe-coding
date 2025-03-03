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
  Collection,
  ErrorResponse,
  OkResponse,
  PaginatedResponse,
  RestExceptionFilter,
} from 'src/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationMonitoringService } from '../services/notification-monitoring.service';

import {
  NotificationListQuery,
  NotificationOutput,
  NotificationPatchQuery,
} from './dtos/notification.dto';
import { NotificationService } from '../services/notification.service';
import { notificationErrorMap } from '../entities/notification-error.map';
import { NotificationMetricsDto } from './dtos/metrics.dto';

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
    private readonly monitoringService: NotificationMonitoringService,
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
  ): Promise<Collection<NotificationOutput>> {
    const notiCollection = await this.notificationService.getManyNotifications({
      where: { userId: user.id },
      skip: query.offset,
      take: query.limit,
    });

    return notiCollection;
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
   * Get notification delivery metrics
   *
   * @returns Notification delivery metrics
   */
  @Get('metrics')
  @ApiOperation({
    summary: 'Get notification delivery metrics',
    description: 'Returns metrics about notification delivery performance',
  })
  @OkResponse(NotificationMetricsDto)
  @RequireAnyRoles(Role.ADMIN)
  async getDeliveryMetrics(): Promise<NotificationMetricsDto> {
    return this.monitoringService.getMetrics();
  }

  /**
   * Reset notification delivery metrics
   *
   * @returns Success message
   */
  @Post('metrics/reset')
  @ApiOperation({
    summary: 'Reset notification delivery metrics',
    description: 'Resets all notification delivery metrics',
  })
  @OkResponse(null)
  @RequireAnyRoles(Role.ADMIN)
  async resetDeliveryMetrics(): Promise<void> {
    return this.monitoringService.resetMetrics();
  }
}
