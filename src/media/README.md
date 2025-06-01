# Media Module

## Overview

The Media Module provides a comprehensive file upload and management system with support for multiple storage providers. **Google Cloud Storage (GCS) is now the default storage provider**, with Wasabi as an alternative option.

## Storage Providers

### Google Cloud Storage (Default)

Google Cloud Storage is the recommended and default storage provider, offering:

- **Integrated authentication** with existing GCS credentials
- **Native signed URL generation** for secure uploads and downloads
- **Automatic file validation** and metadata tracking
- **Cost-effective storage** with multiple storage classes
- **Global CDN integration** capabilities

### Wasabi (Alternative)

Wasabi S3-compatible storage remains available as an alternative:

- **S3-compatible API** for easy migration
- **Cost-effective storage** with predictable pricing
- **Post-based signed URLs** with policy validation
- **Cloudflare CDN integration** support

## Configuration

### Environment Variables

#### Storage Provider Selection

```bash
# Choose storage provider (default: gcs)
MEDIA_STORAGE_PROVIDER=gcs  # or 'wasabi'
```

#### Google Cloud Storage Configuration (Default)

```bash
# GCS bucket name (recommended)
GCS_BUCKET_NAME=your-gcs-bucket-name
# Or use existing variable
USER_ASSET_BUCKET=your-gcs-bucket-name

# GCS project ID (optional - uses default from credentials)
GOOGLE_CLOUD_PROJECT=your-project-id
```

#### Wasabi Configuration (Alternative)

```bash
# Wasabi S3-compatible credentials
WASABI_ACCESS_KEY_ID=your_wasabi_access_key
WASABI_SECRET_ACCESS_KEY=your_wasabi_secret_key
WASABI_BUCKET_NAME=your-bucket-name
WASABI_REGION=eu-central-1
WASABI_ENDPOINT_URL=https://s3.eu-central-1.wasabisys.com
```

#### CDN Configuration (Optional)

```bash
# Cloudflare CDN for optimized delivery
CLOUDFLARE_CDN_BASE_URL=https://cdn.yourdomain.com
```

#### General Media Settings

```bash
# Global file size limits
MEDIA_MAX_SIZE_MB=64
MEDIA_PRESIGNED_URL_EXPIRY_SECONDS=3600

# Purpose-specific settings
MEDIA_AVATAR_MAX_SIZE_MB=32
MEDIA_AVATAR_EXPIRY_SECONDS=1800
MEDIA_GENERAL_MAX_SIZE_MB=32
MEDIA_GENERAL_EXPIRY_SECONDS=3600
MEDIA_POST_MAX_SIZE_MB=16
MEDIA_POST_EXPIRY_SECONDS=3600
MEDIA_TWEET_MAX_SIZE_MB=8
MEDIA_TWEET_EXPIRY_SECONDS=3600
```

## Usage Examples

### Basic File Upload

```typescript
// Generate presigned URL for upload
const result = await mediaService.generatePresignedUrl(
  userId,
  {
    fileName: 'avatar.jpg',
    fileSize: 1024000, // 1MB
    mimeType: 'image/jpeg',
    purpose: 'avatar',
  },
  clientId,
);

// Client uploads file to result.presignedUrl
// File will be available at result.cdnUrl
```

### Purpose-Specific Uploads

```typescript
// Avatar upload
const avatarResult = await mediaService.generatePresignedUrl(userId, {
  fileName: 'profile.jpg',
  fileSize: 500000,
  mimeType: 'image/jpeg',
  purpose: 'avatar',
});

// General upload
const generalResult = await mediaService.generatePresignedUrl(userId, {
  fileName: 'photo.jpg',
  fileSize: 2000000,
  mimeType: 'image/jpeg',
  purpose: 'general',
});

// Post image upload
const postResult = await mediaService.generatePresignedUrl(userId, {
  fileName: 'post_image.jpg',
  fileSize: 1500000,
  mimeType: 'image/jpeg',
  purpose: 'post',
});

// Tweet image upload
const tweetResult = await mediaService.generatePresignedUrl(userId, {
  fileName: 'tweet_image.jpg',
  fileSize: 800000,
  mimeType: 'image/jpeg',
  purpose: 'tweet',
});
```

### File Management Operations

```typescript
// Validate uploaded file
const validation = await mediaService.validateUploadedFile(
  'path/to/uploaded/file.jpg',
  maxSizeBytes,
  'image/jpeg',
);

// Generate read URL for private files
const readUrl = await mediaService.generateReadUrl(
  'path/to/file.jpg',
  3600, // expires in 1 hour
);

// Delete file
await mediaService.deleteFile('path/to/file.jpg');
```

## Supported File Purposes

The module supports different upload purposes with specific configurations:

### `avatar`

- **Path**: `users/{userId}/avatar/{timestamp}-{uuid}.{ext}`
- **Max Size**: 32MB (configurable)
- **Allowed Types**: JPEG, PNG, WebP
- **Expiry**: 30 minutes
- **Thumbnail**: 100x100px

### `general`

- **Path**: `users/{userId}/general/{timestamp}-{uuid}.{ext}`
- **Max Size**: 32MB (configurable)
- **Allowed Types**: All image formats
- **Expiry**: 1 hour
- **Thumbnail**: 200x200px

### `post`

- **Path**: `users/{userId}/posts/{timestamp}-{uuid}.{ext}`
- **Max Size**: 16MB (configurable)
- **Allowed Types**: All image formats
- **Expiry**: 1 hour
- **Thumbnail**: 400x400px

### `tweet`

- **Path**: `users/{userId}/tweets/{timestamp}-{uuid}.{ext}`
- **Max Size**: 8MB (configurable)
- **Allowed Types**: All image formats
- **Expiry**: 1 hour
- **Thumbnail**: 300x300px

## Migration from Wasabi to GCS

If you're migrating from Wasabi to GCS:

1. **Update environment variables**:

   ```bash
   # Change from
   MEDIA_STORAGE_PROVIDER=wasabi

   # To
   MEDIA_STORAGE_PROVIDER=gcs
   GCS_BUCKET_NAME=your-gcs-bucket-name
   ```

2. **Set up GCS authentication** (one of):

   - Service account key file via `GOOGLE_APPLICATION_CREDENTIALS`
   - Workload Identity (recommended for GKE)
   - Application Default Credentials

3. **Create GCS bucket** with appropriate permissions:

   ```bash
   gsutil mb gs://your-gcs-bucket-name
   gsutil iam ch serviceAccount:your-service@project.iam.gserviceaccount.com:objectAdmin gs://your-gcs-bucket-name
   ```

4. **Optional**: Migrate existing files from Wasabi to GCS

## Architecture

```
MediaController
    ↓
MediaService (orchestrates based on storage provider)
    ↓
GcsService (default) | WasabiService (alternative)
    ↓
Google Cloud Storage | Wasabi S3
```

## Security Features

- **Signed URLs**: All uploads use time-limited signed URLs
- **File validation**: MIME type and size validation
- **Purpose-based paths**: Organized file structure by purpose
- **Content-Length enforcement**: Server-side file size limits
- **Metadata tracking**: Upload tracking and file attribution

## Error Handling

The module provides specific error types:

- `ValidationFailedError`: File validation failures
- `ConfigurationError`: Missing or invalid configuration
- `PresignedUrlGenerationFailedError`: URL generation failures

## Performance Considerations

- **CDN Integration**: Use Cloudflare or Cloud CDN for optimal delivery
- **Thumbnail Generation**: Automatic thumbnail URLs for images
- **Caching**: Proper cache headers for static assets
- **Compression**: WebP/AVIF support for modern browsers
