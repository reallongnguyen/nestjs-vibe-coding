import { Notification as NotificationIf } from '@prisma/client';

export class NotificationObject implements PrismaJson.NotificationObjectType {
  id: string;
  name: string;
  type: string;
  image?: string;
}

export class NotificationDecorator
  implements PrismaJson.NotificationDecoratorType
{
  offset: number;
  length: number;
  class: string;
  type?: string;
  link?: string;
}

export class Notification implements NotificationIf {
  id: string;
  key: string;
  type: string;
  userId: string;
  subjects: NotificationObject[];
  subjectCount: number;
  diObject: NotificationObject;
  inObject: NotificationObject;
  prObject: NotificationObject;
  text: string;
  decorators: NotificationDecorator[];
  link: string;
  notificationTime: Date;
  readAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
