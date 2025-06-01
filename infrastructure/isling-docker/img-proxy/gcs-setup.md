# Google Cloud Storage Setup for imgproxy

## Overview

This document describes the process of setting up Google Cloud Storage (GCS) for use with imgproxy, including service account creation, permissions configuration, and integration testing.

## Service Account Setup

1. **Create Service Account**

   ```bash
   # Create a new service account
   gcloud iam service-accounts create imgproxy-service \
     --display-name="imgproxy Service Account"

   # Get the service account email
   SA_EMAIL=$(gcloud iam service-accounts list \
     --filter="displayName:imgproxy Service Account" \
     --format='value(email)')
   ```

2. **Grant Required Permissions**

   ```bash
   # Grant Storage Object Viewer role for user assets bucket
   gcloud storage buckets add-iam-policy-binding gs://user-assets \
     --member="serviceAccount:$SA_EMAIL" \
     --role="roles/storage.objectViewer"

   # Grant Storage Object Viewer role for public assets bucket
   gcloud storage buckets add-iam-policy-binding gs://public-assets \
     --member="serviceAccount:$SA_EMAIL" \
     --role="roles/storage.objectViewer"
   ```

3. **Create and Download Key**

   ```bash
   # Create new key
   gcloud iam service-accounts keys create imgproxy-sa-key.json \
     --iam-account=$SA_EMAIL

   # Base64 encode the key for environment configuration
   base64 -i imgproxy-sa-key.json | tr -d '\n' > gcs-key-base64.txt
   ```

## Bucket Configuration

1. **Create Required Buckets**

   ```bash
   # Create user assets bucket
   gcloud storage buckets create gs://user-assets \
     --location=asia-southeast1 \
     --uniform-bucket-level-access

   # Create public assets bucket
   gcloud storage buckets create gs://public-assets \
     --location=asia-southeast1 \
     --uniform-bucket-level-access
   ```

2. **Configure CORS**

   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "HEAD"],
       "responseHeader": ["Content-Type"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

   Save as `cors.json` and apply:

   ```bash
   gsutil cors set cors.json gs://user-assets
   gsutil cors set cors.json gs://public-assets
   ```

## Environment Configuration

1. **Update Environment Variables**
   Add the following to your `.env` file:

   ```env
   # Google Cloud Storage Configuration
   GCS_KEY_JSON=<content-of-gcs-key-base64.txt>
   GCS_ALLOWED_BUCKETS=user-assets,public-assets
   GCS_REGION=ASIA-SOUTHEAST1
   USER_ASSET_BUCKET=user-assets

   # imgproxy GCS Settings
   IMGPROXY_USE_GCS=true
   IMGPROXY_GCS_KEY=${GCS_KEY_JSON}
   IMGPROXY_ALLOWED_SOURCES=gs://user-assets/*,gs://public-assets/*
   ```

## Testing GCS Integration

1. **Upload Test Image**

   ```bash
   # Upload test image to user assets bucket
   gsutil cp test-image.jpg gs://user-assets/test/image.jpg
   ```

2. **Test Image Processing**

   ```bash
   # Generate signed URL for test image
   curl -f "http://img.docker.localhost/resize:fit:100:100/gs://user-assets/test/image.jpg"
   ```

3. **Verify Access Controls**

   ```bash
   # Should succeed
   curl -f "http://img.docker.localhost/gs://user-assets/test/image.jpg"

   # Should fail (unauthorized bucket)
   curl -f "http://img.docker.localhost/gs://unauthorized-bucket/image.jpg"
   ```

## Security Considerations

1. **Service Account**

   - Use minimal required permissions (Storage Object Viewer only)
   - Regularly rotate service account keys
   - Monitor service account usage

2. **Bucket Access**

   - Configure allowed sources in imgproxy
   - Use uniform bucket-level access
   - Enable audit logging

3. **Network Security**
   - Configure proper CORS settings
   - Use HTTPS for all requests
   - Implement proper URL signing

## Troubleshooting

1. **Permission Issues**

   - Verify service account has Storage Object Viewer role
   - Check bucket permissions
   - Verify key is properly base64 encoded

2. **Access Issues**

   - Verify bucket is in allowed sources
   - Check CORS configuration
   - Verify URL signing

3. **Performance Issues**
   - Check bucket location matches service region
   - Monitor GCS quotas and limits
   - Review imgproxy logs

## Monitoring

Monitor the following metrics:

- GCS operations (read requests, bandwidth)
- Error rates by bucket
- Response times for GCS operations
- Quota usage and limits

## References

1. [GCS Documentation](https://cloud.google.com/storage/docs)
2. [imgproxy GCS Integration](https://docs.imgproxy.net/configuration?id=google-cloud-storage)
3. [GCS Security Best Practices](https://cloud.google.com/storage/docs/best-practices)
