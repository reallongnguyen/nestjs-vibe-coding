import { Injectable } from '@nestjs/common';
import { AppError, PagedResult } from 'src/common/models';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Logger } from 'nestjs-pino';
import { cloneDeep } from 'lodash';
import { NotificationOutput } from '../presentation/dtos/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
  ) {}

  async getManyNotifications(
    findManyArgs: Prisma.NotificationFindManyArgs,
  ): Promise<PagedResult<NotificationOutput>> {
    try {
      const findManyArgsClone = cloneDeep(findManyArgs);
      if (!findManyArgsClone.take) {
        findManyArgsClone.take = 20;
      }

      const notifications = await this.prismaService.notification.findMany({
        ...findManyArgsClone,
        orderBy: [{ notificationTime: 'desc', ...findManyArgsClone.orderBy }],
      });

      const total = await this.prismaService.notification.count({
        where: findManyArgsClone.where,
      });

      const notiOutputs = notifications.map(NotificationOutput.from);

      return new PagedResult(notiOutputs, {
        pageSize: findManyArgsClone.take,
        pageNumber: Math.floor(findManyArgsClone.skip / findManyArgsClone.take),
        totalItems: total,
        totalPages: Math.ceil(total / findManyArgsClone.take),
        hasNextPage: findManyArgsClone.skip + findManyArgsClone.take < total,
        hasPreviousPage: findManyArgsClone.skip > 0,
      });
    } catch (err) {
      this.logger.error(
        `notification: notification.service: getManyNotifications: ${err.message}`,
      );

      throw new AppError('common.serverError');
    }
  }

  async view(userId: string, notificationId?: string): Promise<void> {
    try {
      await this.prismaService.notification.updateMany({
        where: {
          userId,
          id: notificationId,
          viewedAt: null,
        },
        data: {
          viewedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error(
        `notification: notification.service: markNotificationAsRead: ${err.message}`,
      );

      throw new AppError('common.serverError');
    }
  }
}
