# Task Template

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
