# Enhancing Image Delivery with imgproxy

## Introduction

In modern web applications, efficient image delivery is crucial for performance and user experience. Our system currently stores images in Google Cloud Storage with URLs in the format `gs://bucket-name/path/file.png`. While this works well for backend storage, it presents challenges for our NextJS frontend which needs optimized, resized, and transformed images.

This blog post explores how [imgproxy](https://github.com/imgproxy/imgproxy) can solve these challenges and improve our image delivery pipeline.

## What is imgproxy?

imgproxy is a fast and secure standalone server for resizing and converting images. With over 9.3k stars on GitHub, it's a well-established solution in the image processing space. The project is guided by three core principles:

1. **Security** - Protects against image-based attacks and DoS attempts
2. **Speed** - Uses libvips for extremely fast image processing with low memory footprint
3. **Simplicity** - Focuses on essential features without unnecessary complexity

## Why imgproxy for Our Stack?

Our current architecture faces several challenges:

1. **Direct GCS URLs** - Frontend can't directly use `gs://` URLs
2. **Image Optimization** - Different devices and viewports need different image sizes
3. **Format Conversion** - Modern formats like WebP and AVIF can significantly reduce bandwidth
4. **Performance** - Loading full-size images impacts page load times and Core Web Vitals

imgproxy addresses these issues by:

- Acting as a bridge between GCS and the frontend
- Providing on-the-fly resizing and optimization
- Supporting modern image formats
- Caching processed images for improved performance

## Key Features for Our Implementation

For our specific use case, these imgproxy features are particularly valuable:

1. **Cloud Storage Support** - Native integration with Google Cloud Storage
2. **URL Signature Security** - Prevents unauthorized image processing
3. **Format Conversion** - Automatic WebP/AVIF delivery for supported browsers
4. **Responsive Images** - Resize based on client requirements
5. **Caching** - Efficient caching to reduce processing overhead

## Implementation Architecture

The proposed architecture places imgproxy between our frontend and GCS:

```
NextJS Frontend → imgproxy → Google Cloud Storage
```

When a user requests a page:

1. NextJS requests an image via imgproxy with transformation parameters
2. imgproxy fetches the original from GCS if not in cache
3. imgproxy processes the image according to parameters
4. The optimized image is returned to the frontend and cached for future requests

## Docker Deployment Configuration

For our implementation, we'll use Docker to deploy imgproxy. Here's a sample `docker-compose.yml` configuration:

```yaml
version: '3'

services:
  imgproxy:
    image: darthsim/imgproxy:latest
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      # Server configuration
      IMGPROXY_BIND: ":8080"
      IMGPROXY_READ_TIMEOUT: 10
      IMGPROXY_WRITE_TIMEOUT: 10
      IMGPROXY_DOWNLOAD_TIMEOUT: 10
      
      # Google Cloud Storage configuration
      IMGPROXY_USE_GCS: "true"
      # IMGPROXY_GCS_KEY: "" # Not needed if using service account with proper permissions
      
      # Security settings
      IMGPROXY_KEY: "hex-encoded-key"  # Generate with: openssl rand -hex 32
      IMGPROXY_SALT: "hex-encoded-salt" # Generate with: openssl rand -hex 32
      IMGPROXY_SIGNATURE_SIZE: "32"
      IMGPROXY_ALLOWED_SOURCES: "gs://your-bucket-name/"
      
      # Image processing settings
      IMGPROXY_QUALITY: "80"
      IMGPROXY_FORMAT_QUALITY: "jpeg=80,webp=70,avif=50"
      IMGPROXY_ENABLE_WEBP_DETECTION: "true"
      IMGPROXY_MAX_SRC_RESOLUTION: "50"
      
      # Caching settings
      IMGPROXY_TTL: "2592000" # 30 days in seconds
      IMGPROXY_USE_ETAG: "true"
      
      # Miscellaneous
      IMGPROXY_STRIP_METADATA: "true"
      IMGPROXY_STRIP_COLOR_PROFILE: "true"
    healthcheck:
      test: ["CMD", "imgproxy", "health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Google Cloud Storage Integration

To integrate imgproxy with Google Cloud Storage, we need to:

1. **Enable GCS Access**: Set `IMGPROXY_USE_GCS=true` in the environment variables.

2. **Authentication Options**:
   - **Service Account**: If running in Google Cloud, the service account attached to the instance can be used automatically.
   - **JSON Key**: For external deployments, provide the service account JSON key via the `IMGPROXY_GCS_KEY` environment variable.

3. **Permissions Required**:
   - The service account needs at minimum the `Storage Object Viewer` permission on the bucket.

4. **URL Format**:
   When requesting images, use the format:

   ```
   gs://%bucket_name/%file_key
   ```

## URL Structure and Signing

imgproxy uses a specific URL structure for image requests:

```
/%signature/%processing_options/%source_url@%extension
```

For example:

```
/AfrOrF3gWeDA6VOlDG4TzxMv39O7MXnF4CXpKUwGqRM/resize:fill:300:200:1/plain/gs://bucket-name/path/image.jpg@webp
```

The signature is crucial for security. Here's how to generate it in TypeScript:

```typescript
import * as crypto from 'crypto';

function generateImgproxyUrl(
  sourceUrl: string,
  width: number,
  height: number,
  key: string,
  salt: string,
  extension: string = 'auto'
): string {
  // Define processing options
  const processingOptions = `resize:fill:${width}:${height}:1`;
  
  // Encode source URL
  const encodedUrl = Buffer.from(sourceUrl).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  // Path to sign
  const path = `/${processingOptions}/plain/${sourceUrl}@${extension}`;
  
  // Generate signature
  const hmac = crypto.createHmac('sha256', Buffer.from(key, 'hex'));
  hmac.update(Buffer.from(salt, 'hex'));
  hmac.update(Buffer.from(path));
  const signature = hmac.digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `/${signature}${path}`;
}
```

## Performance Benefits

Based on benchmarks, we can expect:

- **Reduced Bandwidth** - Up to 70% smaller images with WebP/AVIF
- **Faster Load Times** - Properly sized images load faster
- **Improved Core Web Vitals** - Particularly Largest Contentful Paint (LCP)
- **Reduced GCS Egress** - Caching at the imgproxy layer reduces cloud costs

## Security Considerations

imgproxy provides several security features:

- **URL Signing** - Prevents unauthorized image processing
- **Size Limiting** - Protects against image bombs
- **Timeouts** - Prevents hanging on malicious images
- **Resource Limits** - Controls CPU and memory usage
- **Allowed Sources** - Restricts which source URLs imgproxy will process

## Frontend Integration

In our NextJS application, we'll create a utility function to generate imgproxy URLs:

```typescript
// utils/imageProxy.ts
import { ImgproxyConfig } from '../config';

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif' | 'auto';
  fit?: 'fill' | 'fit' | 'crop';
}

export function getOptimizedImageUrl(
  originalUrl: string, 
  options: ImageTransformOptions
): string {
  const { width = 0, height = 0, quality = 80, format = 'auto', fit = 'fill' } = options;
  
  // Convert gs:// URL to the format imgproxy expects
  const sourceUrl = originalUrl.startsWith('gs://') 
    ? originalUrl 
    : `gs://${ImgproxyConfig.defaultBucket}/${originalUrl}`;
  
  // Generate processing options
  const processingOptions = `resize:${fit}:${width}:${height}:1/quality:${quality}`;
  
  // Generate signature (implementation depends on your security requirements)
  const signature = generateSignature(processingOptions, sourceUrl, format);
  
  return `${ImgproxyConfig.baseUrl}/${signature}/${processingOptions}/plain/${sourceUrl}@${format}`;
}
```

Then use it in your components:

```tsx
import { getOptimizedImageUrl } from '../utils/imageProxy';

function ProfileImage({ user }) {
  const imageUrl = getOptimizedImageUrl(user.avatarUrl, {
    width: 200,
    height: 200,
    format: 'auto',
    fit: 'fill'
  });
  
  return <img src={imageUrl} alt={`${user.name}'s profile`} />;
}
```

## Monitoring and Observability

For production deployment, we should monitor:

1. **Response Times**: Track processing time for different image sizes and formats
2. **Cache Hit Ratio**: Monitor cache effectiveness
3. **Error Rates**: Track failed image processing attempts
4. **Resource Usage**: Monitor CPU and memory consumption

imgproxy supports various monitoring options including Prometheus metrics, New Relic, and Datadog.

## Next Steps

Our implementation plan:

1. Deploy imgproxy in our Docker environment
2. Configure GCS access and security
3. Update frontend image components to use imgproxy URLs
4. Implement monitoring and performance tracking
5. Optimize caching and scaling based on usage patterns

## Conclusion

Implementing imgproxy will significantly improve our image delivery pipeline, enhancing both performance and user experience. The solution aligns with our architectural principles and provides a secure, efficient bridge between our GCS storage and NextJS frontend.

## References

- [imgproxy GitHub Repository](https://github.com/imgproxy/imgproxy)
- [imgproxy Documentation](https://docs.imgproxy.net/)
- [Google Cloud Storage Integration](https://docs.imgproxy.net/image_sources/google_cloud_storage)
- [Docker Deployment Guide](https://docs.imgproxy.net/installation)
