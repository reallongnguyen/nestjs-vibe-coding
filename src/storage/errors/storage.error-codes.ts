/**
 * Standardized error codes for the Storage module
 * These codes are used by the error factory to create specific error instances
 */
export enum StorageErrorCode {
  // File errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_DOWNLOAD_FAILED = 'FILE_DOWNLOAD_FAILED',
  FILE_DELETE_FAILED = 'FILE_DELETE_FAILED',

  // Avatar errors
  AVATAR_UPLOAD_URL_FAILED = 'AVATAR_UPLOAD_URL_FAILED',

  // Image proxy errors
  IMAGE_PROXY_NOT_FOUND = 'IMAGE_PROXY_NOT_FOUND',
  IMAGE_PROXY_FAILED = 'IMAGE_PROXY_FAILED',
}
