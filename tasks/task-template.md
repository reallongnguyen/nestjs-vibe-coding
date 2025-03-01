# Sprint 004 Planning

## Goals

- Implement user following system
- Refactor notification module following DDD principles
- Enhance content distribution with following-based prioritization
- Improve code quality and maintainability

## Tasks

### SOC-006: Implement User Following System

Status: To Do
Priority: High
Dependencies: None

### Context

- Currently, users cannot follow other users they're interested in
- Need to implement a following system to enhance content discovery and personalization
- This feature will be used by the notification system and content distribution

### Requirements

- Allow users to follow/unfollow other users
- Display follower and following counts on user profiles
- Create a "Following" feed view showing only content from followed users
- Implement notifications for new followers
- Prioritize followed users' content in the main feed

### Acceptance Criteria

1. Users can follow/unfollow other users with a single click
2. User profiles display accurate follower and following counts
3. Users receive notifications when someone follows them
4. The main feed algorithm prioritizes content from followed users
5. A dedicated "Following" feed shows only content from followed users
6. Follow/unfollow actions are responsive (under 500ms)
7. Proper error handling for all operations
8. End-to-end tests verify the following functionality

### Technical Notes

- Use the UserFollow model added to the Prisma schema
- Implement proper database indexing for efficient queries
- Use the event bus for notifications
- Ensure proper cache invalidation when follow status changes
- Update feed scoring algorithm to consider follow relationships
- Follow the established module structure pattern
- Implement repository interfaces with dependency injection

### Sub-tasks

1. Create module structure:
   - Create user-follow module and register in app.module.ts
   - Set up folder structure following module-structure.md
   - Create empty files for all components
   - Define interfaces and DTOs

2. Implement data layer:
   - Create repository interface for user follows
   - Implement Prisma repository
   - Add repository tests
   - Register repository in module

3. Implement service layer:
   - Create UserFollowService with follow/unfollow methods
   - Implement follower/following count methods
   - Add event publishing for follow actions
   - Add service unit tests

4. Implement API layer:
   - Create DTOs for request/response
   - Create controller with follow/unfollow endpoints
   - Add endpoints for getting followers/following lists
   - Add authentication guards
   - Add controller tests

5. Implement following feed:
   - Create service method to get content from followed users
   - Update feed scoring algorithm to prioritize followed users
   - Add "Following" feed endpoint
   - Add feed tests

6. Implement notification integration:
   - Create event handlers for follow events
   - Add notification creation for new followers
   - Test notification flow

7. Add end-to-end tests:
   - Test follow/unfollow functionality
   - Test following feed
   - Test notification generation

---

### SOC-006-1: Create User Following Module Structure

Status: To Do
Priority: High
Dependencies: None

### Context

- Need to establish the foundation for the user following system
- Must follow the established module structure pattern

### Requirements

- Create the module structure following DDD principles
- Define domain entities and interfaces
- Set up repository interfaces
- Create empty service and controller files

### Acceptance Criteria

1. Module structure follows the pattern in `/docs/module-structure.md`
2. All necessary files are created with proper naming conventions
3. Module is registered in the application

### Technical Notes

- Follow the folder structure in `/docs/module-structure.md`
- Create barrel files for clean exports
- Define clear interfaces for repositories and services

### Sub-tasks

1. Create module folder structure
2. Define domain entities (UserFollow)
3. Create repository interfaces
4. Set up empty service classes
5. Create controller skeletons
6. Register module in app.module.ts

---

### SOC-006-2: Implement Follow/Unfollow Functionality

Status: To Do
Priority: High
Dependencies: SOC-006-1

### Context

- Core functionality of the following system
- Users need to be able to follow and unfollow other users

### Requirements

- Implement follow functionality
- Implement unfollow functionality
- Ensure proper validation and error handling
- Publish events for follow/unfollow actions

### Acceptance Criteria

1. Users can follow other users
2. Users can unfollow users they are following
3. Users cannot follow themselves
4. Follow/unfollow operations are responsive (under 500ms)
5. Proper error handling for all operations
6. Events are published for follow/unfollow actions

### Technical Notes

- Use the UserFollow model in Prisma schema
- Implement proper database transactions
- Use the event bus for publishing events
- Add proper validation and error handling
- Implement in the `user-follow` module
- Follow RESTful API design principles

### API Specification

```typescript
// Follow a user
POST /api/v1/users/following/{targetUserId}

Request:
No body required

Response (201):
{
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

// Unfollow a user
DELETE /api/v1/users/following/{targetUserId}

Request:
No body required

Response (200):
No content
```

### Sub-tasks

1. Implement repository methods for follow/unfollow
2. Create service methods for follow/unfollow
3. Add validation logic
4. Implement event publishing
5. Create controller endpoints
6. Add unit tests for service and repository
7. Add integration tests for API endpoints

---

### SOC-006-3: Implement Follower/Following Lists and Counts

Status: To Do
Priority: Medium
Dependencies: SOC-006-2

### Context

- Users need to see who they are following and who follows them
- Profile pages need to display follower/following counts

### Requirements

- Implement API to get a user's followers
- Implement API to get users a user is following
- Implement API to get follower/following counts
- Support pagination for follower/following lists

### Acceptance Criteria

1. API returns paginated list of followers
2. API returns paginated list of users being followed
3. API returns accurate follower/following counts
4. Lists include basic user information (id, name, avatar)
5. Proper error handling for all operations

### Technical Notes

- Implement efficient queries with proper indexing
- Use pagination for large lists
- Include only necessary user information in responses
- Implement in the `user-follow` module
- Use the Collection class from common/models for consistent pagination responses
- Use PaginationQueryDto for request parameters

### API Specification

```typescript
// Get followers of a user
GET /api/v1/users/{userId}/followers

Request:
{
  // Using PaginationQueryDto
  offset?: number; // default: 0
  limit?: number;  // default: 10
}

Response (200):
{
  // Using Collection<T> format
  edges: [
    {
      id: string;
      firstName: string;
      lastName: string | null;
      avatar: string | null;
      followedAt: Date;
    }
  ],
  pagination: {
    limit: number;
    offset: number;
    total: number;
  }
}

// Get users followed by a user
GET /api/v1/users/{userId}/following

Request:
{
  // Using PaginationQueryDto
  offset?: number; // default: 0
  limit?: number;  // default: 10
}

Response (200):
{
  // Using Collection<T> format
  edges: [
    {
      id: string;
      firstName: string;
      lastName: string | null;
      avatar: string | null;
      followedAt: Date;
    }
  ],
  pagination: {
    limit: number;
    offset: number;
    total: number;
  }
}

// Get follower/following counts
GET /api/v1/users/{userId}/follow-counts

Response (200):
{
  followersCount: number;
  followingCount: number;
}
```

### Sub-tasks

1. Implement repository methods for lists and counts
2. Create service methods for retrieving data
3. Add controller endpoints with pagination
4. Create DTOs for response data
5. Add unit tests for service and repository
6. Add integration tests for API endpoints
