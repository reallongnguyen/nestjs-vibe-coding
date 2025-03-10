# Social Events

This document describes the events emitted by the social module.

## Content View Events

### `social.content.viewed`

Emitted when content (post or emotion) is viewed by a user or anonymous viewer.

**Schema Version**: 1.0.0

**Payload**:

```typescript
interface ContentViewedEventPayload {
  contentId: string;      // UUID of the viewed content
  contentType: string;    // Type of content ('post' or 'emotion')
  viewerHash: string;     // Unique hash for view deduplication
  viewerId?: string;      // Optional UUID of the authenticated viewer
  timestamp: Date;        // When the view occurred
}
```

**Example**:

```json
{
  "eventId": "evt_123",
  "eventName": "social.content.viewed",
  "payload": {
    "contentId": "123e4567-e89b-12d3-a456-426614174000",
    "contentType": "post",
    "viewerHash": "abc123",
    "viewerId": "123e4567-e89b-12d3-a456-426614174001",
    "timestamp": "2024-03-21T12:00:00Z"
  },
  "metadata": {
    "timestamp": 1710979200000,
    "version": "1.0.0"
  }
}
```

**Usage**:

1. View Recording:

   ```typescript
   await socialEngagementService.recordView(
     'post',
     contentId,
     viewerHash,
     viewerId, // optional
   );
   ```

2. View Processing:
   - Views are deduplicated using Redis HyperLogLog with a 10-minute TTL
   - Views are batch processed in groups of 100 or every 8 seconds
   - Only new views trigger event emission

3. Gorse Integration:
   - Authenticated views are synced to Gorse as 'read' feedback
   - Anonymous views are not synced
   - Rate limited to 100 requests per second
   - Errors are logged but don't block event processing

**Performance Considerations**:

1. View Deduplication:
   - Uses Redis HyperLogLog for efficient unique counting
   - 10-minute TTL prevents duplicate views
   - Memory usage is constant regardless of view count

2. Batch Processing:
   - Views are batched in groups of 100
   - Maximum wait time of 8 seconds
   - Reduces database load and improves throughput

3. Rate Limiting:
   - Gorse sync is limited to 100 requests per second
   - Prevents overloading the recommendation service
   - Graceful error handling for rate limit exceeded

**Error Handling**:

1. View Recording:
   - Validates content exists before recording
   - Returns immediately for duplicate views
   - Handles transaction rollback on errors

2. Gorse Sync:
   - Skips anonymous views
   - Logs errors without rethrowing
   - Continues processing on sync failures

**Monitoring**:

Monitor the following metrics:

- View count per content type
- Batch processing latency
- Gorse sync success rate
- Rate limit exceeded count
- Error count by type

**Related Components**:

1. Services:
   - `SocialEngagementService`: Records views and emits events
   - `ViewRepository`: Handles view storage and deduplication

2. Handlers:
   - `UpdateViewCountHandler`: Processes view batches
   - `GorseSyncHandler`: Syncs views to Gorse

3. Events:
   - `ContentViewedEvent`: Event class for view events
   - `SocialEventSchemas.CONTENT_VIEWED`: Event schema definition
