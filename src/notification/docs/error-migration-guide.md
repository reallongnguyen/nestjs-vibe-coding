# Notification Module Error Migration Guide

This guide explains how to migrate from the legacy error handling approach to the new standardized error system in the Notification module.

## Overview

The Notification module has been updated to use a standardized error handling system that provides:

1. Consistent error codes with a hierarchical namespace
2. Standardized error response format
3. Proper error documentation in Swagger
4. Type-safe error creation through a factory pattern

## Key Changes

1. **Error Classes**: Specialized error classes for each error type
2. **Error Factory**: A factory class for creating errors
3. **Error Map**: A centralized map of all error codes and their properties
4. **Error Response Decorator**: Swagger documentation for error responses

## Migration Steps

### 1. Use the Error Factory

Replace direct error creation with the factory methods:

```typescript
// Before
throw new AppError('notification.get.notFound');

// After
throw NotificationErrorFactory.notificationNotFound(notificationId);
```

### 2. Update Error Response Decorators

Update controller methods to use the standardized error response decorator:

```typescript
// Before
@ApiResponse({ status: 404, description: 'Notification not found' })

// After
@ErrorResponse('notification.get', NOTIFICATION_ERRORS)
```

### 3. Use the Standardized Error Map

Replace any custom error maps with the standardized one:

```typescript
// Before
const errorFilter = new RestExceptionFilter(notificationErrorMap);

// After
const errorFilter = new RestExceptionFilter(NOTIFICATION_ERRORS);
```

## Error Types

The Notification module defines the following error types:

| Error Class | Factory Method | Error Code | HTTP Status |
|-------------|---------------|------------|-------------|
| NotificationNotFoundError | notificationNotFound | notification.get.notFound | 404 |
| NotificationCreateError | notificationCreateFailed | notification.create.failed | 500 |
| NotificationUpdateError | notificationUpdateFailed | notification.update.failed | 500 |
| NotificationDeleteError | notificationDeleteFailed | notification.delete.failed | 500 |
| NotificationSendError | notificationSendFailed | notification.send.failed | 500 |
| InvalidNotificationTypeError | invalidNotificationType | notification.type.invalid | 400 |
| NotificationTemplateNotFoundError | templateNotFound | notification.template.notFound | 404 |

## Testing

Integration tests have been added to verify the error handling:

```typescript
describe('Notification Not Found Error', () => {
  it('should return 404 with proper error structure when notification not found', async () => {
    const response = await request(app.getHttpServer())
      .get(`/notifications/non-existent-id`)
      .expect(404);
    
    expect(response.body).toMatchObject({
      code: 'notification.get.notFound',
      message: expect.any(String),
    });
  });
});
```

## Best Practices

1. **Always use the factory**: Never create error instances directly
2. **Add proper context**: Include relevant IDs and error causes
3. **Document errors**: Use the ErrorResponse decorator on all endpoints
4. **Test error handling**: Write tests for error scenarios

## Backward Compatibility

The old error map (`notificationErrorMap`) is still exported for backward compatibility but points to the new standardized error map. This will be removed in a future version.
