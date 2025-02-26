import { HttpStatus } from '@nestjs/common';
import { commonErrorMap, ErrorMap } from 'src/common/models/error.map';

export const commentErrorMap: ErrorMap = {
  ...commonErrorMap,
  comment: {
    create: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create comment',
      },
    },
    get: {
      notFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'Comment not found',
      },
    },
    update: {
      notFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'Comment not found',
      },
      notOwner: {
        status: HttpStatus.FORBIDDEN,
        message: 'Not authorized to update this comment',
      },
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update comment',
      },
    },
    delete: {
      notFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'Comment not found',
      },
      notOwner: {
        status: HttpStatus.FORBIDDEN,
        message: 'Not authorized to delete this comment',
      },
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete comment',
      },
    },
    like: {
      alreadyLiked: {
        status: HttpStatus.BAD_REQUEST,
        message: 'Comment already liked',
      },
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to like comment',
      },
    },
    unlike: {
      notLiked: {
        status: HttpStatus.BAD_REQUEST,
        message: 'Comment not liked',
      },
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to unlike comment',
      },
    },
  },
};
