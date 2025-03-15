# Identity Module Documentation

## Overview

The Identity module manages user authentication, authorization, and profile management. It provides APIs for user registration, login, profile management, and role-based access control.

## Error Handling

The Identity module implements standardized error handling using the Error Module. All errors follow a consistent format and are documented in the API specification.

For detailed information about error handling migration, see the [Error Migration Guide](./error-migration-guide.md).

### Error Structure

All errors follow this structure:

```json
{
  "code": "identity.error.code",
  "message": "Human-readable error message",
  "details": {
    "additionalInfo": "Optional additional information"
  }
}
```

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| user.get.notFound | 404 | User not found |
| user.profile.get.notFound | 404 | User profile not found |
| user.bulk.invalidOperation | 400 | Invalid bulk operation |
| user.create.failed | 500 | Failed to create user |
| user.update.failed | 500 | Failed to update user |
| user.delete.failed | 500 | Failed to delete user |
| common.requirePerson | 403 | Operation requires a person entity |

## API Endpoints

### User Management

- `GET /users`: List all users
- `GET /users/:id`: Get user by ID
- `POST /users`: Create a new user
- `PUT /users/:id`: Update a user
- `DELETE /users/:id`: Delete a user
- `POST /users/bulk`: Perform bulk operations on users

### Profile Management

- `GET /users/:id/profile`: Get user profile
- `PUT /users/:id/profile`: Update user profile
- `PATCH /users/:id/profile`: Partially update user profile

## Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  roles: Role[];
}
```

### UserProfile

```typescript
interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Integration Points

The Identity module integrates with:

1. **Authentication Service**: For user authentication and token validation
2. **Notification Module**: For sending user-related notifications
3. **Social Module**: For managing user connections and relationships

## Error Factory Usage

The Identity module uses an error factory pattern for creating errors:

```typescript
// Example: Throwing a user not found error
throw IdentityErrorFactory.userNotFound(userId);

// Example: Throwing a profile not found error
throw IdentityErrorFactory.userProfileNotFound(profileId);
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
