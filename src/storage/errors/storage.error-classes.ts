import { AppError } from '../../common/errors/app.error';
import { StorageErrorCode } from './storage.error-codes';
import { STORAGE_ERRORS } from './storage.errors';

/**
 * Base error class for Storage module errors
 */
export class StorageError extends AppError {
  constructor(code: StorageErrorCode, params?: Record<string, any>) {
    const errorCode = `storage.${code}`;
    super(errorCode, { message: code, status: 500 }, { params });
  }
}

/**
 * File-related error classes
 */
export class FileNotFoundError extends AppError {
  constructor() {
    super(
      StorageErrorCode.FILE_NOT_FOUND,
      STORAGE_ERRORS[StorageErrorCode.FILE_NOT_FOUND],
    );
  }
}

export class FileUploadError extends AppError {
  constructor(cause?: Error) {
    super(
      StorageErrorCode.FILE_UPLOAD_FAILED,
      STORAGE_ERRORS[StorageErrorCode.FILE_UPLOAD_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class FileDownloadError extends AppError {
  constructor(cause?: Error) {
    super(
      StorageErrorCode.FILE_DOWNLOAD_FAILED,
      STORAGE_ERRORS[StorageErrorCode.FILE_DOWNLOAD_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

export class FileDeleteError extends AppError {
  constructor(cause?: Error) {
    super(
      StorageErrorCode.FILE_DELETE_FAILED,
      STORAGE_ERRORS[StorageErrorCode.FILE_DELETE_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Avatar-related error classes
 */
export class AvatarUploadUrlError extends AppError {
  constructor(cause?: Error) {
    super(
      StorageErrorCode.AVATAR_UPLOAD_URL_FAILED,
      STORAGE_ERRORS[StorageErrorCode.AVATAR_UPLOAD_URL_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}

/**
 * Image proxy-related error classes
 */
export class ImageProxyNotFoundError extends AppError {
  constructor() {
    super(
      StorageErrorCode.IMAGE_PROXY_NOT_FOUND,
      STORAGE_ERRORS[StorageErrorCode.IMAGE_PROXY_NOT_FOUND],
    );
  }
}

export class ImageProxyError extends AppError {
  constructor(cause?: Error) {
    super(
      StorageErrorCode.IMAGE_PROXY_FAILED,
      STORAGE_ERRORS[StorageErrorCode.IMAGE_PROXY_FAILED],
      {
        params: { cause: cause?.message },
        cause,
      },
    );
  }
}
