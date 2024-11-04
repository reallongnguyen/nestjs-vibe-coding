import { Injectable } from '@nestjs/common';
import { AppError, Collection } from 'src/common/models';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Logger } from 'nestjs-pino';
import { cloneDeep } from 'lodash';
import { NotificationOutput } from '../controllers/dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private logger: Logger,
    private prismaService: PrismaService,
  ) {}

  async getManyNotifications(
    findManyArgs: Prisma.NotificationFindManyArgs,
  ): Promise<Collection<NotificationOutput>> {
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

      return {
        edges: notiOutputs,
        pagination: {
          offset: findManyArgsClone.skip || 0,
          limit: findManyArgsClone.take,
          total,
        },
      };
    } catch (err) {
      this.logger.error(
        `notification: notification.service: getManyNotifications: ${err.message}`,
      );

      throw new AppError('common.serverError');
    }
  }

  async markNotificationAsRead(
    userId: string,
    notificationId?: string,
  ): Promise<void> {
    try {
      await this.prismaService.notification.updateMany({
        where: {
          userId,
          id: notificationId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
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
