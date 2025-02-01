import { HttpStatus } from '@nestjs/common';
import { commonErrorMap, ErrorMap } from 'src/common/models/error.map';

export const fileErrorMap: ErrorMap = {
  ...commonErrorMap,
  file: {
    common: {
      notFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'file not found',
      },
    },
    getUploadAvatarUrl: {},
  },
  imageProxy: {
    view: {
      notFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'file not found',
      },
    },
  },
};
