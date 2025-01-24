import { HttpStatus } from '@nestjs/common';
import { commonErrorMap, ErrorMap } from 'src/common/models/error.map';

export const userErrorMap: ErrorMap = {
  ...commonErrorMap,
  user: {
    bulk: {},
    create: {},
    list: {},
    get: {
      notFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'User not found',
      },
    },
    search: {},
    password: {
      reset: {},
    },
    profile: {
      get: {
        notFound: {
          status: HttpStatus.NOT_FOUND,
          message: 'User profile not found',
        },
      },
      update: {
        notFound: {
          status: HttpStatus.NOT_FOUND,
          message: 'User not found',
        },
      },
    },
  },
};
