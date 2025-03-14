import { ErrorMap } from 'src/common/models';
import { commonErrorMap } from 'src/common/models/error.map';
import { HttpStatus } from '@nestjs/common';

export const notificationErrorMap: ErrorMap = {
  ...commonErrorMap,
  notification: {
    list: {},
    view: {},
    rateLimit: {
      exceeded: {
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Rate limit exceeded for this notification type',
      },
      check: {
        failed: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to check rate limit status',
        },
      },
      update: {
        failed: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to update rate limit configuration',
        },
      },
    },
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
      get: {
        notFound: {
          status: HttpStatus.NOT_FOUND,
          message: 'Notification template not found',
        },
      },
      create: {
        invalidSyntax: {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid template syntax',
        },
      },
      update: {
        invalidSyntax: {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid template syntax',
        },
      },
      delete: {},
      hotReload: {
        notFound: {
          status: HttpStatus.NOT_FOUND,
          message: 'Notification template not found',
        },
        compileError: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            'Failed to compile template {{type}} for language {{language}}',
        },
      },
      validate: {
        notFound: {
          status: HttpStatus.NOT_FOUND,
          message: 'Notification template not found',
        },
      },
      testRender: {
        notFound: {
          status: HttpStatus.NOT_FOUND,
          message: 'Notification template not found',
        },
        renderError: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            'Failed to render template {{type}} for language {{language}}',
        },
      },
    },
    getRateLimit: {},
    setRateLimit: {
      overrideDisabled: {
        status: HttpStatus.FORBIDDEN,
        message: 'Rate limit override is disabled',
      },
      overrideFailed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to override rate limit',
      },
    },
  },
};
