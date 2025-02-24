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
  },
};
