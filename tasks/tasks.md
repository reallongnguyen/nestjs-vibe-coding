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

Implement API endpoint to allow users to update their existing draft posts.

### Requirements

1. Users must be authenticated to update drafts
2. Users can only update their own drafts
3. All fields can be updated:
   - Title
   - Subtitle
   - Content
   - Cover image
   - Topics
4. System should track update timestamp
5. Request remove cover image from storage if it is removed from the draft by publish command DeleteImageCommand

### Technical Notes

1. Database Schema:
   - Use DraftPost model from Prisma schema
   - Maintain existing relationships
2. Input Validation:
   - Same validation rules as creation
   - Draft must exist
3. Error Handling:
   - Invalid input format
   - Draft not found
   - Unauthorized access
4. Authentication:
   - Use existing AuthGuard
   - Verify user ownership
5. Follow the folder structure in module-structure.md and code style in module `/src/social`

### API Specification

```typescript
PATCH /api/v1/posts/drafts/:id

Request:
{
  title?: string;
  subtitle?: string;
  content?: JsonValue;
  cover?: string;
  topics?: string[];
}

Response (200):
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
   - Add update-draft.dto.ts
   - Update interfaces for update operation

2. Implement data layer:
   - Add update method to repository interface
   - Implement update in Prisma repository
   - Add repository tests for update

3. Implement API layer with mock service:
   - Add PATCH endpoint to controller
   - Add validation decorators
   - Add ownership guard
   - Add mock update implementation
   - Add controller tests

4. Implement business logic:
   - Add update logic to service
   - Add ownership validation
   - Add error handling
   - Add service tests
   - Replace mock with real implementation

5. Add integration tests:
   - Test update scenarios
   - Test ownership validation
   - Test error cases

### Dependencies

Same as CON-001

### Estimated Effort

- Story Points: 3
- Time Estimate: 1-2 days

### Priority

High - Required for content management

## CON-003: Publish Post API

### Description

Implement API endpoint to publish draft posts, converting them to published posts.

### Requirements

1. Users must be authenticated to publish
2. Can only publish own drafts
3. System should:
   - Generate URL slug
   - Calculate reading time
   - Create PublishedPost record
   - Link draft to published version
4. Published posts should be publicly accessible
5. Reading time is calculated based on the content length

### Technical Notes

1. Database Schema:
   - Use PublishedPost and DraftPost models
   - Handle relationships between models
2. Validation:
   - Verify draft exists
   - Validate all required fields present
   - Generate unique slug
3. Error Handling:
   - Draft not found
   - Unauthorized access
   - Validation errors
4. Authentication:
   - Use existing AuthGuard
   - Verify ownership
5. Follow the folder structure in module-structure.md and code style in module `/src/social`

### API Specification

```typescript
POST /api/v1/posts/drafts/:id/publish

Response (201):
{
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  content: JsonValue;
  cover?: string;
  topics: string[];
  readingTime: number;
  publishedAt: Date;
  updatedAt: Date;
}
```

### Sub-tasks

1. Create module structure:
   - Add published-post.dto.ts
   - Add interfaces for published posts

2. Implement data layer:
   - Create published post repository
   - Add publish methods
   - Add repository tests

3. Implement API layer with mock service:
   - Add publish endpoint
   - Add validation
   - Add mock implementation
   - Add controller tests

4. Implement business logic:
   - Add publish logic
   - Implement slug generation
   - Calculate reading time
   - Add service tests
   - Replace mock implementation

5. Add integration tests:
   - Test publish flow
   - Test validation
   - Test error scenarios

### Dependencies

Same as CON-001

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

2. Implement data layer:
   - Add delete methods to repositories
   - Handle cascading deletes
   - Add repository tests

3. Implement API layer with mock service:
   - Add DELETE endpoints
   - Add validation
   - Add mock implementation
   - Add controller tests

4. Implement business logic:
   - Add delete logic
   - Handle cascading deletes
   - Add service tests
   - Replace mock implementation

5. Add integration tests:
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

Implement API endpoints to list draft and published posts with filtering and pagination.

### Requirements

1. Support listing:
   - User's draft posts (authenticated)
   - Published posts (public)
2. Support filtering by:
   - Topics
   - Date range
   - Author
3. Support pagination
4. Support sorting. Default sorting is by created date.

### Technical Notes

1. Database Schema:
   - Efficient querying of posts
   - Handle relationships for filters
2. Performance:
   - Implement pagination
   - Optimize queries
3. Error Handling:
   - Invalid filters
   - Pagination errors
4. Authentication:
   - Use existing AuthGuard for drafts
5. Follow the folder structure in module-structure.md and code style in module `/src/social`

### API Specification

```typescript
GET /api/v1/posts/drafts
GET /api/v1/posts/published

Query Parameters:
{
  page?: number;
  limit?: number;
  topics?: string[];
  fromDate?: string;
  toDate?: string;
  authorId?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

Response (200):
{
  edges: Array<DraftPost | PublishedPost>;
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}
```

### Sub-tasks

1. Create module structure:
   - Add filter DTOs
   - Add pagination interfaces
   - Add response DTOs

2. Implement data layer:
   - Add list methods to repositories
   - Implement filtering and pagination
   - Add repository tests

3. Implement API layer with mock service:
   - Add GET endpoints
   - Add query validation
   - Add mock implementation
   - Add controller tests

4. Implement business logic:
   - Add list logic with filters
   - Implement pagination
   - Add service tests
   - Replace mock implementation

5. Add integration tests:
   - Test filtering
   - Test pagination
   - Test sorting
   - Test error scenarios

### Dependencies

Same as CON-001

### Estimated Effort

- Story Points: 5
- Time Estimate: 2-3 days

### Priority

High - Required for content discovery
