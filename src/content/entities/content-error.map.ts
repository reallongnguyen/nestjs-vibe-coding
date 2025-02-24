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
      message: 'Draft post not found: {{draftId}}',
    },
    notOwner: {
      status: HttpStatus.FORBIDDEN,
      message: 'Not authorized to update this draft',
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
};
