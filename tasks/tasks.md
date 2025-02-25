# Current Sprint Tasks

## CON-001: Create Draft Post API

### Description

Implement API endpoint to allow users to create draft posts. Draft posts are unpublished content that users can save and edit later before publishing.

### Requirements

1. Users must be authenticated to create drafts
2. Draft posts should contain:
   - Title
   - Optional subtitle
   - Content (JSON format)
   - Optional cover image
   - Topics (array of topic IDs)
3. All drafts should be private to the creating user
4. System should validate input data
5. System should track creation and update timestamps

### Technical Notes

1. Database Schema:
   - Use DraftPost model from Prisma schema
   - Maintain relationship with User model
2. Input Validation:
   - Title is required
   - Content must be valid JSON
   - Topics must exist in database
3. Error Handling:
   - Invalid input format
   - Unauthorized access
   - Topic not found
4. Authentication:
   - Use existing AuthGuard
   - Verify user permissions
5. Follow the folder structure in module-structure.md and code style in module `/src/social`

### Acceptance Criteria

1. User can successfully create a draft post with:
   - Required title
   - Optional subtitle
   - JSON content
   - Optional cover image
   - Array of topics
2. System stores:
   - All provided post data
   - Creation timestamp
   - Update timestamp
   - User ID association
3. API returns:
   - Created draft post data
   - Generated draft ID
4. System validates:
   - User authentication
   - Required fields
   - Data formats
5. System handles errors:
   - Returns 401 for unauthenticated requests
   - Returns 400 for invalid input
   - Returns 404 for non-existent topics

### API Specification

```typescript
POST /api/v1/posts/drafts

Request:
{
  title: string;
  subtitle?: string;
  content: JsonValue;
  cover?: string;
  topics: string[];
}

Response (201):
{
  id: string;
  title: string;
  subtitle?: string;
  content: JsonValue;
  cover?: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Sub-tasks

1. Create module structure:
   - Create content module and register in app.module.ts
   - Set up folder structure following module-structure.md
   - Create empty files for all components (controllers, services, etc.)
   - Define interfaces and DTOs

2. Implement data layer:
   - Create repository interface for draft posts
   - Implement Prisma repository
   - Add repository tests
   - Register repository in module

3. Implement API layer with mock service:
   - Create DTOs for request/response
   - Add input validation decorators
   - Create controller with POST endpoint
   - Add authentication guard
   - Add mock service implementation
   - Add controller tests with mock service

4. Implement business logic:
   - Implement draft post service
   - Add input validation logic
   - Add error handling
   - Add service unit tests
   - Replace mock service with real implementation

5. Add integration tests:
   - Set up test database
   - Add end-to-end API tests
   - Test authentication flows
   - Test error scenarios
   - Test successful draft creation

### Dependencies

- User authentication system: Done
- Topic management system: Not started
- File upload system (for cover images): Done. In the file upload service, cover is a string that is the url of the uploaded file.

### Estimated Effort

- Story Points: 5
- Time Estimate: 2-3 days

### Priority

High - Required for basic content creation functionality

## CON-002: Update Draft Post API

### Description

Implement API endpoint to update an existing draft post.

### Requirements

### Functional

- Allow updating an existing draft post
- Support partial updates (only changed fields)
- Validate topic existence
- Only owner can update their drafts
- Maintain created date, update modified date
- Return updated draft post

### Technical

- Endpoint: PATCH /posts/drafts/:id
- Input validation using class-validator
- Transaction support for data consistency
- Proper error handling and logging
- Follow existing patterns from CON-001

## Acceptance Criteria

### API Contract

```typescript
// Request
PATCH /posts/drafts/:id
{
  title?: string;
  subtitle?: string | null;
  content?: Record<string, any>;
  cover?: string | null;
  topics?: string[];
}

// Response 200
{
  id: string;
  title: string;
  subtitle: string | null;
  content: Record<string, any>;
  cover: string | null;
  topics: string[];
  userId: string;
  publishedId: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### Error Cases

- 404: Draft not found
- 404: Topic not found
- 403: Not draft owner
- 400: Invalid input data
- 500: Database error

### Implementation Steps

1. Create module structure
   - Update DTO
   - Repository interface method
   - Service interface method
   - Controller endpoint

2. Implement data layer
   - Add update method to repository
   - Add findById method to repository

3. Implement API layer with mock business logic
   - Add update endpoint to controller
   - Add input validation
   - Add ownership check

4. Implement business logic
   - Add update method to service
   - Add topic validation
   - Add transaction support

5. Add end to end tests
   - Success cases
   - Error cases
   - Authorization cases
   - File name: src/content/test/draft-post.controller.e2e-spec.ts

## Dependencies

- CON-001: Create Draft Post API ✅

## Notes

- Follow existing error handling pattern
- Use transactions for data consistency
- Add proper logging
- Update documentation

### Estimated Effort

- Story Points: 3
- Time Estimate: 1-2 days

### Priority

High - Required for content management

## CON-003: Publish Post API

### Description

Implement API endpoint to publish draft posts, converting them to published posts.

### Requirements

### Functional

- Convert draft post to published post
- Generate unique URL slug from title
- Calculate reading time from content
- Link draft to published version
- Only owner can publish their drafts
- Return published post data

### Technical

- Endpoint: POST /posts/drafts/:id/publish
- Input validation using class-validator
- Transaction support for data consistency
- Proper error handling and logging
- Follow existing patterns from CON-001/002

## Acceptance Criteria

### API Contract

```typescript
// Request
POST /posts/drafts/:id/publish
{
  // Optional overrides for publishing
  title?: string;
  subtitle?: string;
  excerpt?: string; // If not provided, generated from content
}

// Response 201
{
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  content: Record<string, any>;
  excerpt: string;
  cover: string | null;
  readingTime: number;
  topics: string[];
  likeCount: number;
  replyCount: number;
  viewCount: number;
  userId: string;
  publishedAt: string;
  updatedAt: string;
}
```

### Error Cases

- 404: Draft not found
- 403: Not draft owner
- 400: Invalid input data
- 409: Slug already exists
- 500: Database error

### Implementation Steps

1. Create module structure
   - Add PublishDraftDto
   - Add PublishedPost entity
   - Add repository interface methods
   - Add service interface methods
   - Add controller endpoint

2. Implement code

3. Add end to end tests
   - Success cases
   - Error cases
   - Authorization cases
   - File name: src/content/test/draft-post.controller.e2e-spec.ts

## Dependencies

- CON-001: Create Draft Post API ✅
- CON-002: Update Draft Post API ✅

## Notes

- Slug must be unique across all published posts
- Reading time calculation based on word count (avg 200 words/min)
- Excerpt should be max 160 chars from content if not provided
- Add proper logging for debugging
- Update documentation

### Estimated Effort

- Story Points: 5
- Time Estimate: 2-3 days

### Priority

High - Core publishing functionality

## CON-004: Delete Post API

### Description

Implement API endpoints to delete draft and published posts.

### Requirements

1. Users must be authenticated
2. Can only delete own posts
3. Support deleting:
   - Draft posts
   - Published posts
4. Cascade delete related data
5. Request remove cover image from storage if it is removed from the draft by publish command DeleteImageCommand

### Technical Notes

1. Database Schema:
   - Handle cascading deletes
   - Update related records
2. Validation:
   - Verify post exists
   - Verify ownership
3. Error Handling:
   - Post not found
   - Unauthorized access
4. Authentication:
   - Use existing AuthGuard
   - Verify ownership
5. Follow the folder structure in module-structure.md and code style in module `/src/social`

### API Specification

```typescript
DELETE /api/v1/posts/drafts/:id
DELETE /api/v1/posts/published/:id

Response (204)
```

### Sub-tasks

1. Create module structure:
   - Update interfaces for delete operations

2. Implement code

3. Add integration tests:
   - Test delete operations
   - Test cascade effects
   - Test error scenarios

### Dependencies

Same as CON-001

### Estimated Effort

- Story Points: 2
- Time Estimate: 1 day

### Priority

Medium - Required for content management

## CON-005: List Posts API

### Description

Implement API endpoints to list draft and published posts with filtering, pagination, and sorting capabilities.

### Requirements

1. Separate endpoints for:
   - List user's draft posts
   - List published posts (public)
   - List user's published posts

2. Common features:
   - Pagination (page number and size)
   - Sorting (by creation date, update date, title)
   - Basic search by title/content
   - Filter by topics

3. Draft posts endpoint:
   - Only show user's own drafts
   - Include publish status
   - Optional filter by publish status

4. Published posts endpoints:
   - Public endpoint for all published posts
   - Authenticated endpoint for user's published posts
   - Include view/like counts
   - Optional filter by date range

### Technical Notes

1. Use query builder for flexible filtering
2. Implement caching for published posts list
3. Use proper pagination metadata
4. Ensure efficient topic filtering with joins
5. Add rate limiting for public endpoints

### Acceptance Criteria

1. All endpoints return paginated results with metadata
2. Search and filters work as expected
3. Proper error handling for invalid inputs
4. Cache implementation for published posts
5. Performance tests for large datasets
6. Documentation with example requests/responses

### Dependencies

- CON-001: Create Draft Post API
- CON-003: Publish Post API

### Estimated Effort

- Story Points: 5
- Time Estimate: 2-3 days

### Priority

High - Required for content discovery

## CON-006: Improve Post Features

### Description

Enhance the post management workflow by implementing a structured approach for editing published content and improving the publishing process with clear differentiation between initial publishing and updates.

### Requirements

#### Functional Requirements

1. **Create Draft from Published Post**
   - Allow users to create a draft based on an existing published post
   - Link the draft to the original published post via the `publishedId` field
   - Only the post owner can create drafts from their published posts
   - If a draft already exists for a published post, return the existing draft

2. **Delete Draft After Publishing**
   - Automatically delete draft posts after successful publishing
   - Update the publish service to handle this cleanup
   - Ensure this happens within the same transaction

3. **Differentiate Publishing Workflows**
   - Initial publish: Create new published post (existing API)
   - Update publish: Update existing published post (new API)
   - System should detect which workflow to use based on draft's publishedId

#### Technical Requirements

1. **Create Draft from Published Post**
   - Create a new endpoint: `POST /api/v1/posts/published/:id/draft`
   - Copy all content from the published post to the new draft
   - Set the `publishedId` field in the draft to link to the original (to be no need)
   - Handle the case where a draft already exists

2. **Update Published Post API**
   - Create a new endpoint: `POST /api/v1/posts/drafts/:id/apply`
   - Only for drafts with an existing publishedId
   - Update the existing published post instead of creating a new one
   - Maintain the original published date and slug
   - Update the modification timestamp

3. **Delete Draft After Publishing**
   - Modify both publish services to delete the draft after successful publishing
   - Ensure this happens within the same transaction

### API Specifications

#### Create Draft from Published Post

```typescript
// Request
POST /api/v1/posts/published/:id/draft

// Response 201
{
  id: string;
  title: string;
  subtitle?: string;
  content: JsonValue;
  cover?: string;
  topics: string[];
  userId: string;
  publishedId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Apply Draft Changes to Published Post

```typescript
// Request
POST /api/v1/posts/drafts/:id/apply

// Response 200
{
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  content: Record<string, any>;
  excerpt: string;
  cover: string | null;
  readingTime: number;
  topics: string[];
  likeCount: number;
  replyCount: number;
  viewCount: number;
  userId: string;
  publishedAt: string;
  updatedAt: string;
}
```

### Workflow

1. **Creating New Content**:
   - User creates a draft post using existing API
   - User publishes the draft using existing publish API (`POST /api/v1/posts/drafts/:id/publish`)
   - System creates a new published post and deletes the draft

2. **Editing Published Content**:
   - User calls `POST /api/v1/posts/published/:id/draft` to create a draft from a published post
   - User edits the draft using existing draft APIs (`PATCH /api/v1/posts/drafts/:id`)
   - User applies changes using new API (`POST /api/v1/posts/drafts/:id/apply`)
   - System updates the published post and deletes the draft

### Error Cases

- 404: Published post not found
- 404: Draft post not found
- 403: Not post owner
- 400: Invalid input data
- 400: Draft not linked to published post (for apply endpoint)
- 500: Database error

### Implementation Steps

1. Update repository interface to support finding drafts by published ID
2. Implement service method to create a draft from a published post
3. Create controller endpoint for creating a draft from a published post
4. Implement service method to apply draft changes to published post
5. Create controller endpoint for applying draft changes
6. Update both publish services to delete drafts after publishing
7. Add end-to-end tests

### Dependencies

- CON-001: Create Draft Post API ✅
- CON-002: Update Draft Post API ✅
- CON-003: Publish Post API ✅

### Estimated Effort

- Story Points: 4
- Time Estimate: 2-3 days

### Priority

Medium - Improves user experience and content management workflow
