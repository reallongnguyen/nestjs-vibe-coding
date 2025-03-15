import { HttpStatus } from '@nestjs/common';
import { ErrorDefinition } from 'src/common/errors/app.error';
import { StorageErrorCode } from './storage.error-codes';

/**
 * Error definitions for Storage module
 * Each error code maps to a message template and HTTP status code
 */
export const STORAGE_ERRORS: Record<StorageErrorCode, ErrorDefinition> = {
  // File errors
  [StorageErrorCode.FILE_NOT_FOUND]: {
    message: 'File not found',
    status: HttpStatus.NOT_FOUND,
  },
  [StorageErrorCode.FILE_UPLOAD_FAILED]: {
    message: 'Failed to upload file: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [StorageErrorCode.FILE_DOWNLOAD_FAILED]: {
    message: 'Failed to download file: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  [StorageErrorCode.FILE_DELETE_FAILED]: {
    message: 'Failed to delete file: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // Avatar errors
  [StorageErrorCode.AVATAR_UPLOAD_URL_FAILED]: {
    message: 'Failed to generate avatar upload URL: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },

  // Image proxy errors
  [StorageErrorCode.IMAGE_PROXY_NOT_FOUND]: {
    message: 'Image not found',
    status: HttpStatus.NOT_FOUND,
  },
  [StorageErrorCode.IMAGE_PROXY_FAILED]: {
    message: 'Image proxy failed: {{cause}}',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
};
