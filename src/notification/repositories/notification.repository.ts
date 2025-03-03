import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { INotificationRepository } from '../services/interfaces/notification-repository.interface';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    args: Prisma.NotificationFindManyArgs,
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany(args);
  }

  async count(args: Prisma.NotificationCountArgs): Promise<number> {
    return this.prisma.notification.count(args);
  }

  async create(data: Prisma.NotificationCreateInput): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }

  async update(
    id: string,
    data: Prisma.NotificationUpdateInput,
  ): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data,
    });
  }

  async updateMany(
    args: Prisma.NotificationUpdateManyArgs,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.notification.updateMany(args);
  }

  async findFirst(
    args: Prisma.NotificationFindFirstArgs,
  ): Promise<Notification | null> {
    return this.prisma.notification.findFirst(args);
  }
}
