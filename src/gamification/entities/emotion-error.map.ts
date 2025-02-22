import { HttpStatus } from '@nestjs/common';
import { commonErrorMap, ErrorMap } from 'src/common/models/error.map';

export const emotionErrorMap: ErrorMap = {
  ...commonErrorMap,
  emotion: {
    create: {
      invalidType: {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid emotion type',
      },
    },
    get: {
      notFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'Emotion not found',
      },
    },
  },
  streak: {
    get: {
      notFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'User streak not found',
      },
    },
  },
};
