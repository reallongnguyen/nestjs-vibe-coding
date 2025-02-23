import { Injectable } from '@nestjs/common';
import { GetSignedUrlConfig, Storage } from '@google-cloud/storage';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { AppError } from 'src/common/models';
import { v7 as uuidv7 } from 'uuid';

import { UploadUrlDto } from './dto/upload-url.dto';
import { AvatarMimeType } from './models/file-type.enum';

@Injectable()
export class FileService {
  private readonly storage = new Storage();
  private readonly userAssetBucketName: string;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    this.userAssetBucketName = this.configService.get<string>(
      'storage.bucket.userAsset',
    );
  }

  async generateUploadAvatarUrl(
    userId: string,
    mimeType: AvatarMimeType,
    fileSize: number,
  ): Promise<UploadUrlDto> {
    const fileExtension = mimeType.split('/')[1];
    const fileName = `images/users/${userId}/profile/${uuidv7()}.${fileExtension}`;

    return this.generateUploadUrl(this.userAssetBucketName, fileName, fileSize);
  }

  async generateUploadUrl(
    bucketName: string,
    fileName: string,
    limitFileSize?: number,
  ): Promise<UploadUrlDto> {
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes

    const writeOptions: GetSignedUrlConfig = {
      version: 'v4',
      action: 'write',
      expires,
      contentType: 'application/octet-stream',
    };

    if (limitFileSize) {
      writeOptions.extensionHeaders = {
        'x-goog-content-length-range': `0,${limitFileSize}`,
      };
    }

    const readOptions: GetSignedUrlConfig = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

    const [uploadUrl] = await this.storage
      .bucket(bucketName)
      .file(fileName)
      .getSignedUrl(writeOptions);

    const objectUrl = `gs://${bucketName}/${fileName}`;

    const [signedUrl] = await this.storage
      .bucket(bucketName)
      .file(fileName)
      .getSignedUrl(readOptions);

    return {
      uploadUrl,
      expires,
      objectUrl,
      signedUrl,
      uploadHeaders: {
        'Content-Type': 'application/octet-stream',
        ...writeOptions.extensionHeaders,
      },
    };
  }

  async generatePresignedUrl(uri: string): Promise<string> {
    if (!uri.startsWith(`gs://${this.userAssetBucketName}/`)) {
      throw new AppError('file.common.notFound');
    }

    const filePath = uri.replace(`gs://${this.userAssetBucketName}/`, '');

    const [url] = await this.storage
      .bucket(this.userAssetBucketName)
      .file(filePath)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      });

    return url;
  }
}
