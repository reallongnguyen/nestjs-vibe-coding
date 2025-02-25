import { HttpStatus } from '@nestjs/common';
import { ErrorMap, commonErrorMap } from 'src/common/models';

export const socialErrorMap: ErrorMap = {
  ...commonErrorMap,
  post: {
    like: {
      notFound: {
        message: 'Post not found',
        status: HttpStatus.NOT_FOUND,
      },
    },
    likeStatus: {
      notFound: {
        message: 'Post not found',
        status: HttpStatus.NOT_FOUND,
      },
    },
    view: {
      notFound: {
        message: 'Post not found',
        status: HttpStatus.NOT_FOUND,
      },
    },
  },
};
