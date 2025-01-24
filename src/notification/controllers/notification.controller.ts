import {
  Controller,
  Get,
  Patch,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AppError, Collection } from 'src/common/models';
import {
  AuthContext,
  AuthCtx,
  AuthGuard,
  RequireAnyRoles,
  Role,
  RolesGuard,
} from 'src/common/auth';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  FormatRestResponseInterceptor,
  ErrorResponse,
  OkResponse,
  PaginatedResponse,
  RestExceptionFilter,
} from 'src/common/presentation/rest';
import {
  NotificationListQuery,
  NotificationOutput,
  NotificationPatchQuery,
} from './dto/notification.dto';
import { NotificationService } from '../usecases/notification.service';
import { notificationErrorMap } from '../entities/notification-error.map';

@Controller({
  path: 'notifications',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(new FormatRestResponseInterceptor())
@UseFilters(new RestExceptionFilter(notificationErrorMap))
@ApiTags('notifications')
@ErrorResponse('common', notificationErrorMap)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

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
    @AuthContext() authCtx: AuthCtx,
    @Query() query: NotificationListQuery,
  ): Promise<Collection<NotificationOutput>> {
    if (!authCtx.person) {
      throw new AppError('common.requirePerson');
    }

    const notiCollection = await this.notificationService.getManyNotifications({
      where: { userId: authCtx.person.userId },
      skip: query.offset,
      take: query.limit,
    });

    return notiCollection;
  }

  @Patch('read')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description:
      'Mark all notifications that belong to authenticated user as read. If you want to mask a notification as read, you may add a query "id=<notification id>"',
  })
  @OkResponse(null)
  @ErrorResponse('notification.markAsRead', notificationErrorMap)
  async markAsRead(
    @AuthContext() authCtx: AuthCtx,
    @Query() query: NotificationPatchQuery,
  ): Promise<null> {
    if (!authCtx.person) {
      throw new AppError('common.requirePerson');
    }

    await this.notificationService.markNotificationAsRead(
      authCtx.person.userId,
      query.id,
    );

    return null;
  }
}
