import { AppError } from 'src/common/models';

export class NotificationCreateError extends AppError {
  constructor(cause?: Error) {
    super('notification.create.failed', {
      cause: cause?.message,
    });
  }
}

export class NotificationNotFoundError extends AppError {
  constructor(id: string) {
    super('notification.notFound', {
      notificationId: id,
    });
  }
}

export class NotificationUpdateError extends AppError {
  constructor(cause?: Error) {
    super('notification.update.failed', {
      cause: cause?.message,
    });
  }
}
