# API Error Response Examples

This document provides verified examples of error responses for each module's endpoints. These examples are generated from actual E2E tests and can be used to understand the expected error formats and implement proper client-side handling.

## Table of Contents

1. [Standard Error Format](#standard-error-format)
2. [Common Error Responses](#common-error-responses)
3. [User Module Error Examples](#user-module-error-examples)
4. [Social Module Error Examples](#social-module-error-examples)
5. [Content Module Error Examples](#content-module-error-examples)
6. [Feed Module Error Examples](#feed-module-error-examples)

## Standard Error Format

All API error responses follow this standard format:

```json
{
  "code": "module.category.error",
  "message": "Human-readable error message",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "paramName": "Additional context specific to the error"
  }
}
```

## Common Error Responses

### Authentication Errors

**401 Unauthorized**

```json
{
  "code": "common.auth.unauthorized",
  "message": "Authentication required to access this resource",
  "timestamp": "2023-08-15T10:30:45.123Z"
}
```

**403 Forbidden**

```json
{
  "code": "common.auth.forbidden",
  "message": "You don't have permission to perform this action",
  "timestamp": "2023-08-15T10:30:45.123Z"
}
```

### Validation Errors

**400 Bad Request**

```json
{
  "code": "common.validation",
  "message": "Validation failed",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "fields": [
      {
        "field": "email",
        "message": "Email address is invalid"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

### Not Found Errors

**404 Not Found**

```json
{
  "code": "common.resource.notFound",
  "message": "The requested resource was not found",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "resourceType": "user",
    "resourceId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Server Errors

**500 Internal Server Error**

```json
{
  "code": "common.internal",
  "message": "An unexpected error occurred",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "requestId": "req-123456"
  }
}
```

## User Module Error Examples

### POST /users

**409 Conflict - Email Already Exists**

```json
{
  "code": "user.email.exists",
  "message": "A user with this email already exists",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "email": "user@example.com"
  }
}
```

**409 Conflict - Username Already Exists**

```json
{
  "code": "user.username.exists",
  "message": "This username is already taken",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "username": "johndoe"
  }
}
```

### GET /users/{userId}

**404 Not Found - User Not Found**

```json
{
  "code": "user.profile.notFound",
  "message": "User profile not found",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "userId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### PATCH /users/{userId}

**403 Forbidden - Not Own Profile**

```json
{
  "code": "user.profile.notOwner",
  "message": "You can only update your own profile",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "userId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

**400 Bad Request - Invalid Profile Data**

```json
{
  "code": "user.profile.update.validation",
  "message": "Profile update validation failed",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "fields": [
      {
        "field": "bio",
        "message": "Bio cannot exceed 300 characters"
      }
    ]
  }
}
```

## Social Module Error Examples

### POST /social/like/{contentType}/{contentId}

**400 Bad Request - Already Liked**

```json
{
  "code": "social.like.already_exists",
  "message": "You have already liked this content",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "contentType": "post",
    "contentId": "post-123456"
  }
}
```

**404 Not Found - Content Not Found**

```json
{
  "code": "social.content.notFound",
  "message": "The content you're trying to like does not exist",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "contentType": "post",
    "contentId": "post-123456"
  }
}
```

### DELETE /social/like/{contentType}/{contentId}

**404 Not Found - Like Not Found**

```json
{
  "code": "social.unlike.notFound",
  "message": "You have not liked this content",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "contentType": "post",
    "contentId": "post-123456"
  }
}
```

### POST /social/comment/{contentType}/{contentId}

**400 Bad Request - Invalid Comment**

```json
{
  "code": "social.comment.invalid",
  "message": "Comment validation failed",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "reason": "Comment text cannot be empty"
  }
}
```

**403 Forbidden - Comments Disabled**

```json
{
  "code": "social.comment.disabled",
  "message": "Comments are disabled for this content",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "contentType": "post",
    "contentId": "post-123456"
  }
}
```

### DELETE /social/comment/{commentId}

**404 Not Found - Comment Not Found**

```json
{
  "code": "social.comment.notFound",
  "message": "Comment not found",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "commentId": "comment-123456"
  }
}
```

**403 Forbidden - Not Comment Owner**

```json
{
  "code": "social.comment.notOwner",
  "message": "You can only delete your own comments",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "commentId": "comment-123456"
  }
}
```

## Content Module Error Examples

### POST /posts/drafts

**400 Bad Request - Invalid Draft Data**

```json
{
  "code": "common.validation",
  "message": "Validation failed",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "fields": [
      {
        "field": "title",
        "message": "Title is required"
      },
      {
        "field": "content",
        "message": "Content must be valid JSON"
      }
    ]
  }
}
```

### PATCH /posts/drafts/{draftId}

**404 Not Found - Draft Not Found**

```json
{
  "code": "content.draft.notFound",
  "message": "Draft post not found",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "draftId": "draft-123456"
  }
}
```

**403 Forbidden - Not Draft Owner**

```json
{
  "code": "content.draft.notOwner",
  "message": "You can only update your own drafts",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "draftId": "draft-123456"
  }
}
```

**409 Conflict - Concurrent Edit**

```json
{
  "code": "content.draft.concurrentEdit",
  "message": "This draft has been modified by another session",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "currentVersion": 2,
    "requestedVersion": 1
  }
}
```

### POST /posts/drafts/{draftId}/publish

**409 Conflict - Slug Exists**

```json
{
  "code": "content.slug.exists",
  "message": "A post with this slug already exists",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "slug": "existing-slug"
  }
}
```

**403 Forbidden - Prohibited Content**

```json
{
  "code": "content.moderation.prohibited",
  "message": "Content contains prohibited material",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "reason": "Content violates community guidelines"
  }
}
```

**503 Service Unavailable - Analysis Service Unavailable**

```json
{
  "code": "content.analysis.serviceUnavailable",
  "message": "Content analysis service is temporarily unavailable",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "retryAfter": 30
  }
}
```

### DELETE /posts/published/{publishedId}

**404 Not Found - Published Post Not Found**

```json
{
  "code": "content.published.notFound",
  "message": "Published post not found",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "publishedId": "post-123456"
  }
}
```

**403 Forbidden - Not Published Post Owner**

```json
{
  "code": "content.published.notOwner",
  "message": "You can only delete your own published posts",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "publishedId": "post-123456"
  }
}
```

## Feed Module Error Examples

### GET /feed/personalized

**503 Service Unavailable - Personalization Failed**

```json
{
  "code": "feed.personalized.failed",
  "message": "Failed to generate personalized feed",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "reason": "Personalization service unavailable"
  }
}
```

### GET /feed/following

**503 Service Unavailable - Following Feed Failed**

```json
{
  "code": "feed.following.failed",
  "message": "Failed to generate following feed",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "reason": "Following service unavailable"
  }
}
```

### GET /feed/latest

**400 Bad Request - Invalid Cursor**

```json
{
  "code": "feed.pagination.invalidCursor",
  "message": "Invalid pagination cursor",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "cursor": "invalid-cursor-format"
  }
}
```

**503 Service Unavailable - Cache Failed**

```json
{
  "code": "feed.cache.failed",
  "message": "Feed cache service is unavailable",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "fallback": "Using direct database access"
  }
}
```

### GET /feed/trending

**503 Service Unavailable - Enrichment Failed**

```json
{
  "code": "feed.enrichment.failed",
  "message": "Failed to enrich feed content",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "fallback": "Returning non-enriched content"
  }
}
```

**504 Gateway Timeout - Composition Timeout**

```json
{
  "code": "feed.composition.timeout",
  "message": "Feed composition timed out",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "timeout": 30000
  }
}
```

### GET /guest/feed/latest

**503 Service Unavailable - Guest Feed Failed**

```json
{
  "code": "feed.guest.failed",
  "message": "Failed to generate guest feed",
  "timestamp": "2023-08-15T10:30:45.123Z",
  "params": {
    "reason": "Guest service unavailable"
  }
}
```
