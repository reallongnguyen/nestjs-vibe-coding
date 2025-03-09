# Comment Notification Flow

## Overview

The comment notification system handles notifications for two types of interactions:

1. When a user comments on a post
2. When a user replies to a comment

## Event Schema

### Comment Created Event

```typescript
interface CommentEventSchema {
  targetUserId: string;    // ID of the post/emotion owner
  actorId: string;        // ID of the user creating the comment
  contentType: 'POST' | 'EMOTION';  // Type of content being commented on
  contentId: string;      // ID of the post/emotion
  commentId: string;      // ID of the created comment
  preview: string;        // Preview of the comment content
}
```

### Comment Reply Event

Uses the same schema as `CommentEventSchema`, but:

- `targetUserId` is the ID of the parent comment's author
- `commentId` is the ID of the parent comment
- `preview` is the content of the reply

## Flow

1. Comment Creation
   - User creates a comment through the API
   - `CommentService.createComment()` handles the request
   - If it's a top-level comment:
     - Creates comment in database
     - Publishes `COMMENT_CREATED` event
   - If it's a reply:
     - Creates comment in database
     - Publishes `COMMENT_REPLIED` event

2. Event Handling
   - `CommentNotificationHandler` listens for events
   - Checks user's notification preferences
   - If notifications are enabled:
     - Forwards to `NotificationProducerService`

3. Notification Production
   - `NotificationProducerService` creates notification
   - Fetches additional data (user details, post details)
   - Creates notification with proper template
   - Adds to notification queue

4. Notification Processing
   - `NotificationConsumerService` processes queued notifications
   - Applies grouping strategy:
     - Comments on same post are grouped
     - Replies to same comment are grouped
   - Renders notification using templates
   - Stores in database
   - Delivers to user through configured channels

## Templates

### Post Comment Template

```handlebars
EN: {{subjects.[0].name}} commented on your post "{{prObject.name}}"{{#if diObject.name}}: "{{diObject.name}}"{{/if}}
VI: {{subjects.[0].name}} đã bình luận về bài viết "{{prObject.name}}"{{#if diObject.name}}: "{{diObject.name}}"{{/if}}
```

### Comment Reply Template

```handlebars
EN: {{subjects.[0].name}} replied to your comment{{#if inObject.name}}: "{{inObject.name}}"{{/if}}{{#if diObject.name}} with "{{diObject.name}}"{{/if}}
VI: {{subjects.[0].name}} đã trả lời bình luận của bạn{{#if inObject.name}}: "{{inObject.name}}"{{/if}}{{#if diObject.name}} với "{{diObject.name}}"{{/if}}
```

## Grouping Strategy

Comments are grouped based on:

1. Target content (post/emotion)
2. Parent comment (for replies)
3. Time window (configurable, default 1 hour)
4. Maximum subjects per notification (configurable, default 10)

## Error Handling

1. Event Publishing
   - Validates event schema before publishing
   - Retries on temporary failures
   - Logs errors for monitoring

2. Notification Production
   - Handles missing user/content gracefully
   - Retries on temporary failures
   - Uses exponential backoff

3. Notification Processing
   - Validates notification data
   - Handles template rendering errors
   - Retries on delivery failures

## Configuration

Key configuration options:

- `notification.mergeNotificationThreshold`: Time window for grouping (seconds)
- `notification.maxSubjectsPerNotification`: Maximum subjects per notification
- Queue settings:
  - `attempts`: 3
  - `timeout`: 60000ms
  - `backoff`: Exponential with 32000ms base delay
