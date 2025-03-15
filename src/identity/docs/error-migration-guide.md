# Identity Module Error Migration Guide

This guide explains how to migrate from the legacy error handling approach to the new standardized error system in the Identity module.

## Overview

The Identity module has been updated to use a standardized error handling system that provides:

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
throw new AppError('user.get.notFound');

// After
throw IdentityErrorFactory.userNotFound(userId);
```

### 2. Update Error Response Decorators

Update controller methods to use the standardized error response decorator:

```typescript
// Before
@ApiResponse({ status: 404, description: 'User not found' })

// After
@ErrorResponse('user.get', IDENTITY_ERRORS)
```

### 3. Use the Standardized Error Map

Replace any custom error maps with the standardized one:

```typescript
// Before
const errorFilter = new RestExceptionFilter(userErrorMap);

// After
const errorFilter = new RestExceptionFilter(IDENTITY_ERRORS);
```

## Error Types

The Identity module defines the following error types:

| Error Class | Factory Method | Error Code | HTTP Status |
|-------------|---------------|------------|-------------|
| UserNotFoundError | userNotFound | user.get.notFound | 404 |
| UserProfileNotFoundError | userProfileNotFound | user.profile.get.notFound | 404 |
| InvalidBulkOperationError | invalidBulkOperation | user.bulk.invalidOperation | 400 |
| UserCreateError | userCreateFailed | user.create.failed | 500 |
| UserUpdateError | userUpdateFailed | user.update.failed | 500 |
| UserDeleteError | userDeleteFailed | user.delete.failed | 500 |
| RequirePersonError | requirePerson | common.requirePerson | 403 |

## Testing

Integration tests have been added to verify the error handling:

```typescript
describe('User Not Found Error', () => {
  it('should return 404 with proper error structure when user not found', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/non-existent-id`)
      .expect(404);
    
    expect(response.body).toMatchObject({
      code: 'user.get.notFound',
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

The old error map (`userErrorMap`) is still exported for backward compatibility but points to the new standardized error map. This will be removed in a future version.
