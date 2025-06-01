import { v4 as uuidv4 } from 'uuid';

export interface MediaFile {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  key: string;
  purpose?: string;
  cdnUrl: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Media implements MediaFile {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  key: string;
  purpose?: string;
  cdnUrl: string;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<MediaFile>) {
    this.id = data.id || uuidv4();
    this.userId = data.userId;
    this.fileName = data.fileName;
    this.fileSize = data.fileSize;
    this.mimeType = data.mimeType;
    this.key = data.key;
    this.purpose = data.purpose;
    this.cdnUrl = data.cdnUrl;
    this.uploadedAt = data.uploadedAt || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static create(
    data: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'>,
  ): Media {
    return new Media(data);
  }

  isImage(): boolean {
    return this.mimeType.startsWith('image/');
  }

  getSizeInMb(): number {
    return this.fileSize / (1024 * 1024);
  }
}
