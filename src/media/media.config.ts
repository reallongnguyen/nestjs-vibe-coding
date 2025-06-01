/* eslint-disable @typescript-eslint/no-unused-vars */
export interface ThumbnailConfig {
  width: number;
  height: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp' | 'avif';
}

export interface PurposeConfig {
  pathPattern: string;
  maxSizeMb: number;
  allowedMimeTypes: string[];
  presignedUrlExpirySeconds: number;
  requiresClientId?: boolean;
  requiresInspectionId?: boolean;
  additionalValidation?: Record<string, any>;
  thumbnail: ThumbnailConfig;
}

export type StorageProvider = 'gcs' | 'wasabi';

export interface MediaConfig {
  storageProvider: StorageProvider;
  gcs: {
    bucketName: string;
    projectId?: string;
  };
  wasabi: {
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    region: string;
    endpointUrl: string;
  };
  cloudflare: {
    cdnBaseUrl: string;
  };
  thumbnails: {
    defaultConfig: ThumbnailConfig;
  };
  purposes: Record<string, PurposeConfig>;
  defaultPurpose: string;
  globalSettings: {
    maxSizeMb: number;
    presignedUrlExpirySeconds: number;
    allowedMimeTypes: string[];
  };
}

export const mediaConfig = (): { media: MediaConfig } => {
  // Default MIME types for images
  const defaultImageMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/tiff',
    'image/bmp',
    'image/svg+xml',
  ];

  return {
    media: {
      storageProvider:
        (process.env.MEDIA_STORAGE_PROVIDER as StorageProvider) || 'gcs',
      gcs: {
        bucketName:
          process.env.GCS_BUCKET_NAME || process.env.USER_ASSET_BUCKET || '',
        projectId: process.env.GOOGLE_CLOUD_PROJECT || '',
      },
      wasabi: {
        accessKeyId: process.env.WASABI_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || '',
        bucketName: process.env.WASABI_BUCKET_NAME || '',
        region: process.env.WASABI_REGION || 'ap-northeast-1',
        endpointUrl:
          process.env.WASABI_ENDPOINT_URL ||
          'https://s3.ap-northeast-1.wasabisys.com',
      },
      cloudflare: {
        cdnBaseUrl: process.env.CLOUDFLARE_CDN_BASE_URL || '',
      },
      thumbnails: {
        defaultConfig: {
          width: 128,
          height: 128,
          quality: 75,
          format: 'jpeg',
        },
      },
      defaultPurpose: process.env.MEDIA_DEFAULT_PURPOSE || 'general',
      globalSettings: {
        maxSizeMb: parseInt(process.env.MEDIA_MAX_SIZE_MB, 10) || 64,
        presignedUrlExpirySeconds:
          parseInt(process.env.MEDIA_PRESIGNED_URL_EXPIRY_SECONDS, 10) || 3600,
        allowedMimeTypes: defaultImageMimeTypes,
      },
      purposes: {
        avatar: {
          pathPattern: 'users/{userId}/avatar/{timestamp}-{uuid}.{ext}',
          maxSizeMb: parseInt(process.env.MEDIA_AVATAR_MAX_SIZE_MB, 10) || 32,
          allowedMimeTypes: process.env.MEDIA_AVATAR_MIME_TYPES
            ? process.env.MEDIA_AVATAR_MIME_TYPES.split(',')
            : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          presignedUrlExpirySeconds:
            parseInt(process.env.MEDIA_AVATAR_EXPIRY_SECONDS, 10) || 1800, // 30 min
          thumbnail: {
            width: 100,
            height: 100,
            quality: 75,
            format: 'jpeg',
          },
        },
        general: {
          pathPattern: 'users/{userId}/general/{timestamp}-{uuid}.{ext}',
          maxSizeMb: parseInt(process.env.MEDIA_GENERAL_MAX_SIZE_MB, 10) || 32,
          allowedMimeTypes: process.env.MEDIA_GENERAL_MIME_TYPES
            ? process.env.MEDIA_GENERAL_MIME_TYPES.split(',')
            : defaultImageMimeTypes,
          presignedUrlExpirySeconds:
            parseInt(process.env.MEDIA_GENERAL_EXPIRY_SECONDS, 10) || 3600, // 1 hour
          thumbnail: {
            width: 200,
            height: 200,
            quality: 80,
            format: 'jpeg',
          },
        },
        post: {
          pathPattern: 'users/{userId}/posts/{timestamp}-{uuid}.{ext}',
          maxSizeMb: parseInt(process.env.MEDIA_POST_MAX_SIZE_MB, 10) || 16,
          allowedMimeTypes: process.env.MEDIA_POST_MIME_TYPES
            ? process.env.MEDIA_POST_MIME_TYPES.split(',')
            : defaultImageMimeTypes,
          presignedUrlExpirySeconds:
            parseInt(process.env.MEDIA_POST_EXPIRY_SECONDS, 10) || 3600, // 1 hour
          thumbnail: {
            width: 400,
            height: 400,
            quality: 85,
            format: 'jpeg',
          },
        },
        tweet: {
          pathPattern: 'users/{userId}/tweets/{timestamp}-{uuid}.{ext}',
          maxSizeMb: parseInt(process.env.MEDIA_TWEET_MAX_SIZE_MB, 10) || 8,
          allowedMimeTypes: process.env.MEDIA_TWEET_MIME_TYPES
            ? process.env.MEDIA_TWEET_MIME_TYPES.split(',')
            : defaultImageMimeTypes,
          presignedUrlExpirySeconds:
            parseInt(process.env.MEDIA_TWEET_EXPIRY_SECONDS, 10) || 3600, // 1 hour
          thumbnail: {
            width: 300,
            height: 300,
            quality: 80,
            format: 'jpeg',
          },
        },
      },
    },
  };
};

// Helper function to get purpose configuration
export const getPurposeConfig = (purpose: string): PurposeConfig => {
  const config = mediaConfig().media;
  return config.purposes[purpose] || config.purposes[config.defaultPurpose];
};

// Helper function to generate storage path
export const generateStoragePath = (
  purpose: string,
  variables: Record<string, string>,
): string => {
  const purposeConfig = getPurposeConfig(purpose);
  let path = purposeConfig.pathPattern;

  // Replace all variables in the path pattern
  Object.entries(variables).forEach(([key, value]) => {
    path = path.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });

  return path;
};

// Helper function to validate purpose requirements
export const validatePurposeRequirements = (
  _purpose: string,
  _data: Record<string, any>,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // All new purposes (avatar, general, post, tweet) don't have special requirements
  // This function is kept for future extensibility
  // The purpose and data parameters are kept for API compatibility

  return {
    isValid: errors.length === 0,
    errors,
  };
};
