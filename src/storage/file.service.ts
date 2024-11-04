import { Injectable } from '@nestjs/common';
import { GetSignedUrlConfig, Storage } from '@google-cloud/storage';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { AppError } from 'src/common/models/AppError';
import { UploadUrlDto } from './dto/upload-url.dto';
import { AvatarMimeType } from './models/file-type.enum';

@Injectable()
export class FileService {
  private storage = new Storage();

  constructor(
    private logger: Logger,
    private configService: ConfigService,
  ) {}

  async generateUploadAvatarUrl(
    userId: string,
    mimeType: AvatarMimeType,
    fileSize: number,
  ): Promise<UploadUrlDto> {
    const userAssetBucketName = this.configService.get<string>(
      'gcp.bucket.userAsset',
    );
    const fileExtension = mimeType.split('/')[1];
    const fileName = `${userId}/profile/avatar.${fileExtension}`;

    return this.generateUploadUrl(userAssetBucketName, fileName, fileSize);
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

    try {
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
      };
    } catch (err) {
      this.logger.error(`file: generateUploadUrl: ${err.message}`);

      throw new AppError('common.serverError');
    }
  }
}
