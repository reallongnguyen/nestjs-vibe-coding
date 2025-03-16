# Error Standardization: Troubleshooting Guide

This guide provides solutions for common error scenarios encountered in the platform. It's designed to help developers and support teams resolve issues efficiently.

## Table of Contents

1. [Common Error Patterns](#common-error-patterns)
2. [Authentication & Authorization Errors](#authentication--authorization-errors)
3. [User Module Errors](#user-module-errors)
4. [Social Module Errors](#social-module-errors)
5. [Content Module Errors](#content-module-errors)
6. [Feed Module Errors](#feed-module-errors)
7. [Recovery Strategies](#recovery-strategies)
8. [Frontend Handling Best Practices](#frontend-handling-best-practices)

## Common Error Patterns

All API errors follow a standard format:

```json
{
  "code": "module.category.error",
  "message": "Human-readable error message",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "paramName": "Optional additional context"
  }
}
```

The `code` field always follows the pattern `module.category.error` and should be used for programmatic handling. The `message` is intended for logging and debugging, while the `params` object provides additional context specific to the error.

## Authentication & Authorization Errors

### common.auth.unauthorized (401)

**Description**: The request lacks valid authentication credentials.

**Common Causes**:

- Missing authentication token
- Expired authentication token
- Malformed authentication token

**Solutions**:

1. Check if the token is provided in the Authorization header
2. Verify the token hasn't expired and request a new one if needed
3. Ensure the token is correctly formatted as `Bearer <token>`

### common.auth.forbidden (403)

**Description**: The authenticated user doesn't have permission to perform the requested action.

**Common Causes**:

- User lacks required role or permission
- User trying to access a resource they don't own
- Account restrictions in place

**Solutions**:

1. Verify the user has the necessary permissions or roles
2. Check ownership relationships for the resource
3. Ensure the user account is in good standing

## User Module Errors

### user.profile.notFound (404)

**Description**: The requested user profile couldn't be found.

**Common Causes**:

- Invalid user ID
- Deleted user account
- User hasn't completed profile setup

**Solutions**:

1. Verify the user ID is correct
2. Check if the user has been deactivated or deleted
3. Direct user to complete profile if applicable

### user.profile.update.validation (400)

**Description**: User profile update failed validation.

**Common Causes**:

- Invalid email format
- Username contains prohibited characters
- Profile fields exceed length limits

**Solutions**:

1. Check the `params` object for specific validation details
2. Ensure emails follow standard formats
3. Review username rules (usually alphanumeric, underscore, no spaces)

### user.email.exists (409)

**Description**: The email address is already registered.

**Common Causes**:

- User attempting to register with an existing email
- User trying to update profile with another user's email

**Solutions**:

1. Prompt user to use a different email address
2. Offer password recovery if user might be trying to re-register

## Social Module Errors

### social.like.already_exists (400)

**Description**: User has already liked the content.

**Common Causes**:

- Duplicate like request
- UI state not reflecting existing like

**Solutions**:

1. Refresh UI state to show the content is already liked
2. Implement optimistic UI updates with proper error handling

### social.comment.notFound (404)

**Description**: The requested comment doesn't exist.

**Common Causes**:

- Comment was deleted
- Invalid comment ID
- Temporary data inconsistency

**Solutions**:

1. Refresh the comment list
2. Check if comment was moderated or deleted
3. Verify the comment ID is correct

### social.share.contentUnavailable (403)

**Description**: Content cannot be shared due to visibility restrictions.

**Common Causes**:

- Content has been deleted or unpublished
- Content visibility changed
- User lacks permission to view the content

**Solutions**:

1. Remove share option for unavailable content
2. Refresh content status before attempting share
3. Check user permissions for the content

## Content Module Errors

### content.draft.notFound (404)

**Description**: The requested draft post doesn't exist.

**Common Causes**:

- Draft was deleted
- Draft was already published
- Invalid draft ID

**Solutions**:

1. Refresh drafts list
2. Check if the draft was converted to a published post
3. Verify the draft ID is correct

### content.slug.exists (409)

**Description**: The requested URL slug is already in use.

**Common Causes**:

- Duplicate post titles generating the same slug
- Manual slug entry duplicating existing slug

**Solutions**:

1. Suggest an alternative slug (e.g., by adding a number)
2. Auto-generate a unique slug based on the title
3. Show existing posts with similar slugs

### content.moderation.prohibited (403)

**Description**: Content contains prohibited material that violates guidelines.

**Common Causes**:

- Content contains prohibited terms or material
- Images fail content policy check
- Links to prohibited content

**Solutions**:

1. Review content policy and highlight potentially problematic content
2. Implement pre-check for prohibited terms before submission
3. Provide guidance on what content is acceptable

### content.draft.concurrentEdit (409)

**Description**: The draft was modified by another session.

**Common Causes**:

- Multiple tabs/devices editing the same content
- Stale version information in the request

**Solutions**:

1. Refresh to get the latest version
2. Implement conflict resolution UI (diff view)
3. Lock drafts for editing to prevent conflicts

## Feed Module Errors

### feed.personalized.failed (503)

**Description**: Error generating personalized feed due to service issues.

**Common Causes**:

- Recommendation service unavailable
- User preference data inaccessible
- Internal processing error

**Solutions**:

1. Fallback to non-personalized feed
2. Implement retry with exponential backoff
3. Cache previous feed results to handle outages

### feed.pagination.invalidCursor (400)

**Description**: The pagination cursor is invalid or expired.

**Common Causes**:

- Using an expired cursor from an old session
- Malformed cursor parameter
- Changes to underlying data making cursor invalid

**Solutions**:

1. Reset to first page of results
2. Re-fetch cursor from current page
3. Implement time-based expiration handling for cursors

### feed.cache.failed (503)

**Description**: Feed cache service is unavailable.

**Common Causes**:

- Redis/cache service failure
- Network issues between services
- Cache invalidation issues

**Solutions**:

1. Fallback to direct database queries
2. Implement in-memory caching as secondary backup
3. Set up monitoring for cache service health

## Recovery Strategies

### General Recovery Patterns

When encountering errors, follow these general strategies:

1. **Retry with Backoff**: For transient errors (5xx), implement exponential backoff:

   ```javascript
   async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 300) {
     for (let attempt = 0; attempt < maxRetries; attempt++) {
       try {
         return await fn();
       } catch (error) {
         // Only retry on 5xx (service) errors
         if (!error.response || error.response.status < 500) {
           throw error;
         }
         
         const delay = baseDelay * Math.pow(2, attempt);
         console.log(`Retrying after ${delay}ms...`);
         await new Promise(resolve => setTimeout(resolve, delay));
       }
     }
     throw new Error('Maximum retries reached');
   }
   ```

2. **Conflict Resolution**: For 409 Conflict errors:
   - Fetch the latest version of the resource
   - Apply your changes to the latest version
   - Resubmit with updated version information

3. **Validation Recovery**: For 400 Bad Request errors:
   - Check the `params` object for specific field errors
   - Highlight problematic fields to the user
   - Provide specific guidance based on the error code

### Service Dependency Failures

When a dependent service fails:

1. Implement circuit breakers to fail fast during outages
2. Use fallback data sources where possible
3. Degrade functionality gracefully rather than showing errors
4. Cache critical data locally to survive short outages

## Frontend Handling Best Practices

### Error Display Guidelines

1. **For 4xx errors**: Display specific, actionable error messages
   - Map error codes to user-friendly messages
   - Highlight fields with issues
   - Provide clear instructions for resolution

2. **For 5xx errors**: Display general service availability messages
   - Don't expose technical details to users
   - Offer retry options
   - Provide alternative workflows if available

### Error Handling Implementation

```typescript
// Example React error handler
import { AxiosError } from 'axios';

interface ApiError {
  code: string;
  message: string;
  timestamp: string;
  params?: Record<string, any>;
}

function handleApiError(error: AxiosError<ApiError>) {
  // Extract standardized error if available
  const apiError = error.response?.data;
  
  if (!apiError) {
    // Network or client-side error
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the service. Please check your connection.',
      recoverable: true
    };
  }
  
  // Handle based on error code patterns
  if (apiError.code.startsWith('common.auth.')) {
    // Auth errors - redirect to login
    return handleAuthError(apiError);
  }
  
  if (apiError.code.startsWith('user.')) {
    // User-related errors
    return handleUserError(apiError);
  }
  
  // Default error handling
  return {
    title: 'Error',
    message: apiError.message,
    code: apiError.code,
    recoverable: error.response?.status < 500
  };
}

// Usage:
try {
  await api.updateProfile(data);
} catch (error) {
  const { title, message, recoverable } = handleApiError(error);
  showErrorNotification(title, message, recoverable);
}
```

### Graceful Degradation

Implement progressive enhancement to ensure your application remains usable even when certain features fail:

1. Cache essential data locally
2. Implement offline-first capabilities where possible
3. Design UI to work with partial data
4. Show placeholders during loading/error states
5. Prioritize critical user flows over non-essential features
