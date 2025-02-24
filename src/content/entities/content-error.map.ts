import { HttpStatus } from '@nestjs/common';
import { ErrorMap } from 'src/common/models/error.map';

export const contentErrorMap: ErrorMap = {
  draft: {
    create: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create draft post',
      },
      topicNotFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'One or more topics not found: {{missingTopicIds}}',
      },
    },
    update: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update draft post',
      },
    },
    notFound: {
      status: HttpStatus.NOT_FOUND,
      message: 'Draft post not found',
    },
    notOwner: {
      status: HttpStatus.FORBIDDEN,
      message: 'Not authorized to update this draft',
    },
    delete: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete draft post',
      },
    },
    publish: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to publish draft post',
      },
      slugExists: {
        status: HttpStatus.CONFLICT,
        message: 'A post with this slug already exists: {{slug}}',
      },
    },
  },
  published: {
    notFound: {
      status: HttpStatus.NOT_FOUND,
      message: 'Published post not found',
    },
    notOwner: {
      status: HttpStatus.FORBIDDEN,
      message: 'You are not the owner of this published post',
    },
    delete: {
      failed: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete published post',
      },
    },
  },
};
