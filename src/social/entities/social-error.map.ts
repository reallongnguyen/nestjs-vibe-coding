import { HttpStatus } from '@nestjs/common';
import { commonErrorMap, ErrorMap } from 'src/common/models/error.map';

export const socialErrorMap: ErrorMap = {
  ...commonErrorMap,
  social: {
    like: {
      alreadyLiked: {
        status: HttpStatus.BAD_REQUEST,
        message: 'Content already liked',
      },
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to like content',
      },
    },
    unlike: {
      notLiked: {
        status: HttpStatus.BAD_REQUEST,
        message: 'Content not liked',
      },
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to unlike content',
      },
    },
    view: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to record view',
      },
    },
    engageable: {
      notFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'Engageable content not found',
      },
    },
    engagement: {
      get: {},
    },
  },
};
