# Social Engagement API

## Record Content View

Records a view of content (post or emotion) by a user or anonymous viewer.

### Request

`POST /api/v1/social/engagement/view`

```typescript
interface RecordViewRequest {
  contentId: string;      // UUID of the content to view
  contentType: string;    // Type of content ('post' or 'emotion')
  viewerHash: string;     // Unique hash for view deduplication
  viewerId?: string;      // Optional UUID of the authenticated viewer
}
```

### Response

```typescript
interface RecordViewResponse {
  success: boolean;       // Whether the view was recorded
  isNewView: boolean;     // Whether this was a new view
}
```

### Example

```bash
curl -X POST 'https://api.example.com/api/v1/social/engagement/view' \
  -H 'Content-Type: application/json' \
  -d '{
    "contentId": "123e4567-e89b-12d3-a456-426614174000",
    "contentType": "post",
    "viewerHash": "abc123",
    "viewerId": "123e4567-e89b-12d3-a456-426614174001"
  }'
```

### Response Example

```json
{
  "success": true,
  "isNewView": true
}
```

### Error Responses

- `404 Not Found`: Content does not exist
- `400 Bad Request`: Invalid request parameters
- `429 Too Many Requests`: Rate limit exceeded

### Notes

1. View Deduplication:
   - Views are deduplicated using a 10-minute window
   - Same viewer (by hash) viewing same content within window counts as one view
   - Anonymous views are tracked but not synced to recommendation system

2. Performance:
   - Views are processed in batches for better performance
   - Rate limiting applies to prevent abuse
   - Non-blocking event emission for view counts

3. Integration:
   - Authenticated views are synced to recommendation system
   - View counts are updated asynchronously
   - Events are emitted for analytics and recommendations

## Get Engagement Stats

Retrieves engagement statistics for content.

### Request

`GET /api/v1/social/engagement/stats/{contentType}/{contentId}`

### Response

```typescript
interface EngagementStats {
  viewCount: number;      // Total unique views
  likeCount: number;      // Total likes
  commentCount: number;   // Total comments
}
```

### Example

```bash
curl 'https://api.example.com/api/v1/social/engagement/stats/post/123e4567-e89b-12d3-a456-426614174000'
```

### Response Example

```json
{
  "viewCount": 1000,
  "likeCount": 50,
  "commentCount": 25
}
```

### Error Responses

- `404 Not Found`: Content does not exist
- `400 Bad Request`: Invalid content type
