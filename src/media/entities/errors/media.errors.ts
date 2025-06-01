import { HttpStatus } from '@nestjs/common';
import { ErrorDefinition } from 'src/common/errors/app.error';
import { MediaErrorCode } from './media.error-codes';

export const MEDIA_ERRORS = {
  [`media.${MediaErrorCode.FILE_TOO_LARGE}`]: {
    message: 'File size exceeds maximum allowed limit',
    status: HttpStatus.BAD_REQUEST,
  },
  [`media.${MediaErrorCode.INVALID_FILE_TYPE}`]: {
    message: 'File type is not supported',
    status: HttpStatus.BAD_REQUEST,
  },
  [`media.${MediaErrorCode.INVALID_MIME_TYPE}`]: {
    message: 'MIME type is not allowed',
    status: HttpStatus.BAD_REQUEST,
  },
  [`media.${MediaErrorCode.VALIDATION_FAILED}`]: {
    message: 'Purpose validation requirements not met',
    status: HttpStatus.BAD_REQUEST,
  },
  [`media.${MediaErrorCode.PRESIGNED_URL_GENERATION_FAILED}`]: {
    message: 'Failed to generate presigned URL',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [`media.${MediaErrorCode.MEDIA_NOT_FOUND}`]: {
    message: 'Media resource not found',
    status: HttpStatus.NOT_FOUND,
  },
  [`media.${MediaErrorCode.UPLOAD_FAILED}`]: {
    message: 'File upload failed',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [`media.${MediaErrorCode.CONFIGURATION_ERROR}`]: {
    message: 'Media service configuration error',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
} as const satisfies Record<string, ErrorDefinition>;

export type MediaErrorKey = keyof typeof MEDIA_ERRORS;
