import { HttpStatus } from '@nestjs/common';

export type ErrorMapType = {
  [key: string]:
    | {
        status: HttpStatus;
        message: string;
      }
    | ErrorMapType;
};

export type ErrorMap = {
  [key: string]: ErrorMapType;
};

export const commonErrorMap: ErrorMap = {
  common: {
    serverError: {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    },
    invalidToken: {
      status: HttpStatus.UNAUTHORIZED,
      message: 'Access token has expired or is not valid',
    },
    invalidApiKey: {
      status: HttpStatus.UNAUTHORIZED,
      message: 'Invalid or missing API key',
    },
    noPrivilege: {
      status: HttpStatus.FORBIDDEN,
      message: 'Required one of the following roles: [{{roles}}]',
    },
    forbidden: {
      status: HttpStatus.FORBIDDEN,
      message: 'Forbidden',
    },
    requirePerson: {
      status: HttpStatus.FORBIDDEN,
      message: 'Agent must be a person',
    },
    requireUser: {
      status: HttpStatus.FORBIDDEN,
      message: 'Agent must be a user',
    },
  },
  validation: {
    validationFailed: {
      status: HttpStatus.BAD_REQUEST,
      message: 'Validation failed. Please check the input values.',
    },
  },
};
