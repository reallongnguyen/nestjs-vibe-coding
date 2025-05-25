import { Prisma } from 'src/generated/client';
import { Notification } from '../../entities/notification.entity';

export interface INotificationRepository {
  findMany(args: Prisma.NotificationFindManyArgs): Promise<Notification[]>;
  count(args: Prisma.NotificationCountArgs): Promise<number>;
  create(data: Prisma.NotificationCreateInput): Promise<Notification>;
  update(
    id: string,
    data: Prisma.NotificationUpdateInput,
  ): Promise<Notification>;
  updateMany(
    args: Prisma.NotificationUpdateManyArgs,
  ): Promise<Prisma.BatchPayload>;
  findFirst(
    args: Prisma.NotificationFindFirstArgs,
  ): Promise<Notification | null>;
}
