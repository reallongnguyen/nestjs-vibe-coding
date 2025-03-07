# Technical Specification: INF-001 Image Proxy Implementation

## Infrastructure Architecture

### 1. Service Integration

```ascii
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│    Traefik   │────▶│   imgproxy   │
└──────────────┘     └──────────────┘     └──────────────┘
                           │                      │
                           │                      │
                     ┌──────────────┐     ┌──────────────┐
                     │ API Service  │     │     GCS      │
                     └──────────────┘     └──────────────┘
```

### 2. Docker Configuration

#### 2.1 Service Definition

```yaml
services:
  imgproxy:
    image: darthsim/imgproxy:v3
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.imgproxy.rule=Host(`${IMGPROXY_HOST}`)"
      - "traefik.http.services.imgproxy.loadbalancer.server.port=8080"
      - "traefik.http.routers.imgproxy.middlewares=imgproxy-ratelimit"
      - "traefik.http.middlewares.imgproxy-ratelimit.ratelimit.average=100"
      - "traefik.http.middlewares.imgproxy-ratelimit.ratelimit.burst=50"
    environment:
      IMGPROXY_KEY: ${IMGPROXY_KEY}
      IMGPROXY_SALT: ${IMGPROXY_SALT}
      IMGPROXY_MAX_SRC_RESOLUTION: 50
      IMGPROXY_MAX_ANIMATION_FRAMES: 200
      IMGPROXY_ALLOW_ORIGIN: "*"
      IMGPROXY_ENFORCE_WEBP: "true"
      IMGPROXY_ENFORCE_AVIF: "true"
      IMGPROXY_ENABLE_WEBP_DETECTION: "true"
      IMGPROXY_ENABLE_AVIF_DETECTION: "true"
      IMGPROXY_ENABLE_CLIENT_HINTS: "true"
      IMGPROXY_USE_GCS: "true"
      IMGPROXY_GCS_KEY: ${GCS_KEY_JSON}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - vpc-bridge
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### 3. Environment Variables

Add to `.env`:

```env
IMGPROXY_HOST=img.local.dev
IMGPROXY_KEY=your-key-here
IMGPROXY_SALT=your-salt-here
GCS_KEY_JSON=base64-encoded-key
```

### 4. Security Configuration

#### 4.1 URL Signing

```typescript
// src/common/services/image/image-url.service.ts
export class ImageUrlService {
  private readonly key: Buffer;
  private readonly salt: Buffer;
  
  constructor(
    @Inject(CONFIG_TOKEN) private readonly config: Config
  ) {
    this.key = Buffer.from(config.imgproxy.key, 'hex');
    this.salt = Buffer.from(config.imgproxy.salt, 'hex');
  }

  generateSignedUrl(options: ImageProcessingOptions): string {
    // Implementation details...
  }
}
```

#### 4.2 GCS Configuration

- Bucket access: Read-only
- Service account permissions:
  - `storage.objects.get`
  - `storage.objects.list`

### 5. Image Processing Configuration

#### 5.1 Default Transformations

```typescript
export const DEFAULT_IMAGE_PROCESSING_OPTIONS = {
  resize: {
    width: 800,
    height: 600,
    type: 'fit'
  },
  quality: 80,
  format: 'auto',
  strip: true,
  compress: true
} as const;
```

#### 5.2 Preset Configurations

```typescript
export const IMAGE_PRESETS = {
  thumbnail: {
    width: 150,
    height: 150,
    type: 'fill'
  },
  preview: {
    width: 400,
    height: 300,
    type: 'fit'
  },
  full: {
    width: 1200,
    height: 900,
    type: 'fit'
  }
} as const;
```

### 6. Monitoring Setup

#### 6.1 Prometheus Metrics

Add to prometheus/prometheus.yml:

```yaml
scrape_configs:
  - job_name: 'imgproxy'
    static_configs:
      - targets: ['imgproxy:8080']
    metrics_path: '/metrics'
```

#### 6.2 Grafana Dashboard

Create dashboard with panels for:

- Request rate
- Processing time
- Cache hit ratio
- Error rate
- Memory usage

### 7. Cache Configuration

#### 7.1 imgproxy Settings

```env
IMGPROXY_TTL=2592000                # 30 days
IMGPROXY_MAX_CACHE_SIZE=2147483648  # 2GB
```

#### 7.2 CDN Configuration (Future)

- Setup CloudFront/Cloud CDN
- Configure cache behaviors
- Set up SSL certificates

### 8. Error Handling

#### 8.1 Common Error Types

```typescript
export class ImageProcessingError extends BaseError {
  constructor(
    message: string,
    public readonly code: ImageErrorCode,
    public readonly originalError?: Error
  ) {
    super(message);
  }
}
```

#### 8.2 Error Responses

- 400: Invalid parameters
- 401: Invalid signature
- 403: Forbidden source
- 404: Image not found
- 422: Processing error
- 500: Internal server error

### 9. Testing Strategy

#### 9.1 Unit Tests

- URL signing
- Parameter validation
- Error handling
- Configuration loading

#### 9.2 Integration Tests

- GCS connectivity
- Image processing
- Cache operations
- Metric collection

#### 9.3 Performance Tests

- Concurrent processing
- Large image handling
- Cache effectiveness
- Memory usage

### 10. Deployment Steps

1. Update docker-compose.yml
2. Generate key/salt pairs
3. Configure GCS credentials
4. Deploy service
5. Verify health checks
6. Test image processing
7. Monitor metrics
8. Update documentation
