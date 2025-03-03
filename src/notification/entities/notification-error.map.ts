import { ErrorMap } from 'src/common/models';
import { commonErrorMap } from 'src/common/models/error.map';
import { HttpStatus } from '@nestjs/common';

export const notificationErrorMap: ErrorMap = {
  ...commonErrorMap,
  notification: {
    list: {},
    view: {},
    preference: {
      list: {},
      get: {
        notFound: {
          status: HttpStatus.NOT_FOUND,
          message: 'Notification preference not found',
        },
      },
      create: {
        alreadyExists: {
          status: HttpStatus.CONFLICT,
          message: 'Notification preference already exists',
        },
      },
      update: {
        notFound: {
          status: HttpStatus.NOT_FOUND,
          message: 'Notification preference not found',
        },
      },
    },
    template: {
      notFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'Notification template not found',
      },
      invalidContent: {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid template content',
      },
    },
  },
};
