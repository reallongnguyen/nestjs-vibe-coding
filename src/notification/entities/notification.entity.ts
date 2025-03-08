import { Notification as NotificationIf } from '@prisma/client';

export class NotificationObject implements PrismaJson.NotificationObjectType {
  id: string;
  name: string;
  type: string;
  thumbnail?: string;
}

export class SubjectObject implements PrismaJson.SubjectObjectType {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  type: string;
  avatar?: string;
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
  subjects: SubjectObject[];
  subjectCount: number;
  diObject: NotificationObject | null;
  inObject: NotificationObject | null;
  prObject: NotificationObject | null;
  text: string;
  decorators: NotificationDecorator[];
  link: string | null;
  metadata: Record<string, unknown> | null;
  notificationTime: Date;
  viewedAt: Date | null;
  groupKey: string | null;
  groupCount: number;
  lastEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
