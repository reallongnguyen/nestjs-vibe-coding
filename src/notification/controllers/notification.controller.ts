import {
  Controller,
  Get,
  Patch,
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
  Collection,
  ErrorResponse,
  OkResponse,
  PaginatedResponse,
  RestExceptionFilter,
} from 'src/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

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
  // eslint-disable-next-line prettier/prettier
}
