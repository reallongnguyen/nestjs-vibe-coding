import { AppError } from 'src/common/errors/app.error';
import { MediaErrorCode } from './media.error-codes';

export class MediaError extends AppError {
  constructor(code: MediaErrorCode, params?: Record<string, any>) {
    const errorCode = `media.${code}`;
    super(errorCode, { message: code, status: 400 }, { params });
  }
}

export class FileTooLargeError extends MediaError {
  constructor(fileSize: number, maxSize: number) {
    super(MediaErrorCode.FILE_TOO_LARGE, { fileSize, maxSize });
  }
}

export class InvalidFileTypeError extends MediaError {
  constructor(fileType: string, allowedTypes: string[]) {
    super(MediaErrorCode.INVALID_FILE_TYPE, { fileType, allowedTypes });
  }
}

export class InvalidMimeTypeError extends MediaError {
  constructor(mimeType: string) {
    super(MediaErrorCode.INVALID_MIME_TYPE, { mimeType });
  }
}

export class PresignedUrlGenerationFailedError extends MediaError {
  constructor(reason: string) {
    super(MediaErrorCode.PRESIGNED_URL_GENERATION_FAILED, { reason });
  }
}

export class MediaNotFoundError extends MediaError {
  constructor(mediaId: string) {
    super(MediaErrorCode.MEDIA_NOT_FOUND, { mediaId });
  }
}

export class UploadFailedError extends MediaError {
  constructor(reason: string) {
    super(MediaErrorCode.UPLOAD_FAILED, { reason });
  }
}

export class ConfigurationError extends MediaError {
  constructor(message: string) {
    super(MediaErrorCode.CONFIGURATION_ERROR, { message });
  }
}

export class ValidationFailedError extends MediaError {
  constructor(errors: string[]) {
    super(MediaErrorCode.VALIDATION_FAILED, { errors: errors.join(', ') });
  }
}
