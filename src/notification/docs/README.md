# Notification Module Documentation

## Overview

The Notification module manages the creation, delivery, and tracking of notifications across the platform. It provides APIs for sending notifications, managing notification preferences, and tracking notification status.

## Error Handling

The Notification module implements standardized error handling using the Error Module. All errors follow a consistent format and are documented in the API specification.

For detailed information about error handling migration, see the [Error Migration Guide](./error-migration-guide.md).

### Error Structure

All errors follow this structure:

```json
{
  "code": "notification.error.code",
  "message": "Human-readable error message",
  "details": {
    "additionalInfo": "Optional additional information"
  }
}
```

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| notification.get.notFound | 404 | Notification not found |
| notification.create.failed | 500 | Failed to create notification |
| notification.update.failed | 500 | Failed to update notification |
| notification.delete.failed | 500 | Failed to delete notification |
| notification.send.failed | 500 | Failed to send notification |
| notification.type.invalid | 400 | Invalid notification type |
| notification.template.notFound | 404 | Notification template not found |

## API Endpoints

### Notification Management

- `GET /notifications`: List all notifications
- `GET /notifications/:id`: Get notification by ID
- `POST /notifications`: Create a new notification
- `PUT /notifications/:id`: Update a notification
- `DELETE /notifications/:id`: Delete a notification
- `POST /notifications/send`: Send a notification

### Notification Preferences

- `GET /notifications/preferences/:userId`: Get user notification preferences
- `PUT /notifications/preferences/:userId`: Update user notification preferences

### Notification Templates

- `GET /notifications/templates`: List all notification templates
- `GET /notifications/templates/:id`: Get notification template by ID
- `POST /notifications/templates`: Create a new notification template
- `PUT /notifications/templates/:id`: Update a notification template
- `DELETE /notifications/templates/:id`: Delete a notification template

## Data Models

### Notification

```typescript
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  recipientId: string;
  senderId: string;
  status: NotificationStatus;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}
```

### NotificationTemplate

```typescript
interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### NotificationPreference

```typescript
interface NotificationPreference {
  id: string;
  userId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Integration Points

The Notification module integrates with:

1. **User Module**: For recipient and sender information
2. **Email Service**: For sending email notifications
3. **Push Notification Service**: For sending push notifications
4. **SMS Service**: For sending SMS notifications

## Error Factory Usage

The Notification module uses an error factory pattern for creating errors:

```typescript
// Example: Throwing a notification not found error
throw NotificationErrorFactory.notificationNotFound(notificationId);

// Example: Throwing a template not found error
throw NotificationErrorFactory.templateNotFound(templateId);
```

## Testing

The module includes:

1. **Unit Tests**: For testing individual components
2. **Integration Tests**: For testing module integration
3. **E2E Tests**: For testing API endpoints
4. **Error Handling Tests**: For verifying error responses

## Best Practices

1. Always use the error factory for creating errors
2. Document all API endpoints with proper error responses
3. Include relevant context in error details
4. Write tests for error scenarios
5. Use notification templates for consistent messaging
6. Respect user notification preferences
