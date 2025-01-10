import { HttpStatus } from '@nestjs/common';

export const commonErrorMap = {
  common: {
    serverError: {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    },
    invalidToken: {
      status: HttpStatus.UNAUTHORIZED,
      message: 'Access token has expired or is not valid',
    },
    noPrivilege: {
      status: HttpStatus.FORBIDDEN,
      message: 'Required one of the following roles: [{{roles}}]',
    },
    requirePerson: {
      status: HttpStatus.FORBIDDEN,
      message: 'Agent must be a person',
    },
  },
  validation: {
    validationFailed: {
      status: HttpStatus.BAD_REQUEST,
      message: 'Validation failed. Please check the input values.',
    },
  },
};
