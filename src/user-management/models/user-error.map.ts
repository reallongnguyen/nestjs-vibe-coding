import { HttpStatus } from '@nestjs/common';
import { commonErrorMap } from 'src/common/models/common-error.map';

export const userErrorMap = {
  ...commonErrorMap,
  user: {
    create: {},
    list: {},
    getProfile: {
      notFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'user profile not found',
      },
    },
  },
};
