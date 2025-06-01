export interface PresignedUrlOptions {
  clientId?: string;
}

export interface PresignedUrlResult {
  presignedUrl: string;
  key: string;
  expiresAt: Date;
  cdnUrl: string;
  thumbnailUrl?: string;
  uploadId: string;
  maxFileSizeBytes: number;
  method: string;
  conditions: any[];
  // For POST uploads
  fields?: Record<string, string>;
}

export interface StorageProvider {
  generatePresignedUrl(
    userId: string,
    fileName: string,
    purpose?: string,
    options?: PresignedUrlOptions,
  ): Promise<PresignedUrlResult>;

  validateUploadedFile(
    key: string,
    expectedMaxSize: number,
    expectedMimeType: string,
  ): Promise<{
    isValid: boolean;
    actualSize?: number;
    actualMimeType?: string;
  }>;

  deleteFile(key: string): Promise<void>;

  generateReadUrl(key: string, expiresIn?: number): Promise<string>;
}
