import {
  AvatarUploadUrlError,
  FileDeleteError,
  FileDownloadError,
  FileNotFoundError,
  FileUploadError,
  ImageProxyError,
  ImageProxyNotFoundError,
} from './storage.error-classes';

/**
 * Factory for creating Storage module errors
 * Provides a consistent way to create error instances
 */
export class StorageErrorFactory {
  /**
   * Creates an error for when a file is not found
   * @returns FileNotFoundError
   */
  static fileNotFound(): FileNotFoundError {
    return new FileNotFoundError();
  }

  /**
   * Creates an error for when file upload fails
   * @param cause - The original error
   * @returns FileUploadError
   */
  static fileUploadFailed(cause?: Error): FileUploadError {
    return new FileUploadError(cause);
  }

  /**
   * Creates an error for when file download fails
   * @param cause - The original error
   * @returns FileDownloadError
   */
  static fileDownloadFailed(cause?: Error): FileDownloadError {
    return new FileDownloadError(cause);
  }

  /**
   * Creates an error for when file deletion fails
   * @param cause - The original error
   * @returns FileDeleteError
   */
  static fileDeleteFailed(cause?: Error): FileDeleteError {
    return new FileDeleteError(cause);
  }

  /**
   * Creates an error for when avatar upload URL generation fails
   * @param cause - The original error
   * @returns AvatarUploadUrlError
   */
  static avatarUploadUrlFailed(cause?: Error): AvatarUploadUrlError {
    return new AvatarUploadUrlError(cause);
  }

  /**
   * Creates an error for when an image is not found via the proxy
   * @returns ImageProxyNotFoundError
   */
  static imageProxyNotFound(): ImageProxyNotFoundError {
    return new ImageProxyNotFoundError();
  }

  /**
   * Creates an error for when the image proxy fails
   * @param cause - The original error
   * @returns ImageProxyError
   */
  static imageProxyFailed(cause?: Error): ImageProxyError {
    return new ImageProxyError(cause);
  }
}
