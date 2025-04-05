# Story Chain Feature Implementation: Technical Design

## SC-01: Story Data Model Implementation

Metadata:
  Type: Feature
  Component: Backend
  Priority: High
  Status: Backlog

Dependencies:
  Blocked By: None
  Related: [SC-02, SC-03, SC-04, SC-05]

Description:
  Implement the Story model with chain relationship capabilities to support the story chain feature. This task involves creating the database schema, entity models, and repository implementations.

Requirements:

- Support parent-child relationships between stories
- Track the root story of each chain
- Maintain position information within chains
- Provide efficient query capabilities for chain traversal
- Ensure data integrity for chain operations

Instructions:

  1. [ ] Create Story entity model extending core Tweet functionality
  2. [ ] Add parent-child relationship fields and navigation properties
  3. [ ] Implement rootId and chainPosition fields
  4. [ ] Create Prisma schema migration for the Story model
  5. [ ] Implement StoryRepository interface with standard CRUD operations
  6. [ ] Add specialized query methods for chain traversal and retrieval
  7. [ ] Implement optimized indexes for chain-related queries
  8. [ ] Write unit tests for repository operations
  9. [ ] Create documentation for the data model and relationships

Technical Notes:

- Use self-referencing relationships in Prisma for parent-child connections
- Implement a rootId field to efficiently retrieve entire chains
- Add a chainPosition field to maintain story order within a chain
- Create indexes on parentId, rootId, and chainPosition fields for query optimization
- Ensure deletion cascades are properly configured to maintain data integrity
- Use versioning field for optimistic concurrency control

Acceptance Criteria:

  1. [ ] Story model created with all required fields and relationships
  2. [ ] Migration scripts successfully update the database schema
  3. [ ] Repository implementation provides all required query methods
  4. [ ] Unit tests verify data integrity for chain operations
  5. [ ] Queries perform within acceptable time limits for chain retrieval
  6. [ ] Documentation clearly explains the data model and relationships

References:

- Similar implementation: src/content/tweet/models/tweet.model.ts
- Prisma documentation: <https://www.prisma.io/docs/concepts/components/prisma-schema/relations/self-relations>

## SC-02: Story Creation API

Metadata:
  Type: Feature
  Component: Backend
  Priority: High
  Status: Backlog

Dependencies:
  Blocked By: [SC-01]
  Related: [SC-03, SC-04, SC-07]

Description:
  Implement the API endpoint for creating initial stories that can become the starting points of chains.

Requirements:

- Allow users to create stories with text content and optional images
- Validate story content according to business rules
- Properly initialize chain metadata for new stories
- Emit events for story creation

Instructions:

  1. [ ] Create CreateStoryDto with content and image fields
  2. [ ] Implement StoryController with POST /stories endpoint
  3. [ ] Add request validation for content length and image count
  4. [ ] Implement StoryService with createStory method
  5. [ ] Add logic to initialize root story chain metadata
  6. [ ] Implement event emission for StoryCreatedEvent
  7. [ ] Write integration tests for the story creation flow
  8. [ ] Add Swagger documentation for the API endpoint

Technical Notes:

- Reuse validation logic from the Tweet module where applicable
- Initialize chainPosition to 0 for root stories
- Set rootId to the story's own ID for root stories
- Ensure proper error handling for validation failures
- Implement idempotency for story creation requests
- Use the existing image validation service for image validation

Acceptance Criteria:

  1. [ ] POST /stories endpoint successfully creates new stories
  2. [ ] Story content is properly validated according to business rules
  3. [ ] Chain metadata is correctly initialized for new stories
  4. [ ] StoryCreatedEvent is emitted with correct payload
  5. [ ] Integration tests verify the complete story creation flow
  6. [ ] API endpoint is documented with Swagger

References:

- Similar implementation: src/content/tweet/presentation/tweet.controller.ts
- Event schema reference: src/common/event-manager/entities/events/schemas/content.events.ts

## SC-03: Story Continuation API

Metadata:
  Type: Feature
  Component: Backend
  Priority: High
  Status: In Progress

Dependencies:
  Blocked By: [SC-01, SC-02]
  Related: [SC-04, SC-07]

Description:
  Implement the API for continuing existing stories, creating parent-child relationships in story chains.

Requirements:

- Allow users to create stories that continue from existing stories
- Maintain parent-child relationships between stories
- Calculate and store the correct chain position
- Preserve the root story reference
- Emit events for story continuation

Instructions:

  1. [x] Create ContinueStoryDto with content, images, and parentId fields
  2. [x] Implement POST /stories/{parentId}/continue endpoint in StoryController
  3. [x] Add validation for parent story existence and status
  4. [x] Implement continuationAllowed validation logic
  5. [x] Create StoryService.continueStory method with chain position calculation
  6. [x] Add event emission for StoryContinuedEvent
  7. [ ] Write integration tests for story continuation flows
  8. [x] Document the API endpoint with Swagger

Technical Notes:

- Calculate chainPosition as parent.chainPosition + 1
- Inherit rootId from the parent story
- Add validation to prevent continuing archived stories
- Implement concurrency handling for simultaneous continuations
- Consider using database transactions for atomicity
- Add authorization checks for continuation permissions if needed

Acceptance Criteria:

  1. [x] POST /stories/{parentId}/continue endpoint successfully creates continuation stories
  2. [x] Parent-child relationships are correctly established
  3. [x] Chain position is accurately calculated and stored
  4. [x] Root story reference is preserved across the chain
  5. [x] StoryContinuedEvent is emitted with correct payload
  6. [ ] Integration tests verify chain integrity after continuation
  7. [x] API endpoint is documented with Swagger

References:

- Related model: src/content/tweet/models/tweet.model.ts
- Authentication reference: src/common/auth/guards/auth.guard.ts

## SC-04: Story Forking API

Metadata:
  Type: Feature
  Component: Backend
  Priority: High
  Status: In Progress

Dependencies:
  Blocked By: [SC-01, SC-02]
  Related: [SC-03, SC-07]

Description:
  Implement the API for forking stories to create alternative narrative branches, similar to git branch operations.

Requirements:

- Allow users to create new story branches from any point in a chain
- Create forked stories that reference original stories but start new chains
- Properly initialize chain metadata for forked stories
- Emit events for story forking operations

Instructions:

  1. [x] Create ForkStoryDto with content, images, and sourceStoryId fields
  2. [x] Implement POST /stories/{storyId}/fork endpoint in StoryController
  3. [x] Add validation for source story existence and permissions
  4. [x] Create StoryService.forkStory method
  5. [x] Implement logic to initialize new chain with appropriate metadata
  6. [x] Add event emission for StoryForkedEvent
  7. [ ] Write integration tests for forking operations
  8. [x] Document the API endpoint with Swagger

Technical Notes:

- Set parentId to the sourceStoryId to maintain the fork relationship
- Initialize rootId as the forked story's own ID (starting a new chain)
- Reset chainPosition to 0 for the new chain root
- Add reference to source chain in metadata for potential future merging
- Consider implementing a fork counter on original stories for analytics
- Add proper authorization checks for fork permissions

Acceptance Criteria:

  1. [x] POST /stories/{storyId}/fork endpoint successfully creates forked stories
  2. [x] Forked stories maintain reference to source story but start new chains
  3. [x] Chain metadata is correctly initialized for the new branch
  4. [x] StoryForkedEvent is emitted with correct payload
  5. [ ] Integration tests verify fork relationship integrity
  6. [x] API endpoint is documented with Swagger

References:

- Similar concept: Git branching model
- Existing event bus: src/common/event-manager/services/event-bus.service.ts

## SC-05: Story Chain Retrieval API

Metadata:
  Type: Feature
  Component: Backend
  Priority: High
  Status: In Progress

Dependencies:
  Blocked By: [SC-01]
  Related: [SC-06]

Description:
  Implement an API endpoint to retrieve complete story chains, including all branches and continuations.

Requirements:

- [x] Create DTOs for chain response structure
- [x] Implement service method to build story chains
- [x] Add repository method for finding stories by root ID
- [x] Create GET /stories/{rootId}/chain endpoint
- [ ] Write integration tests for chain retrieval
- [x] Add proper error handling for invalid requests
- [x] Document the API endpoint with Swagger

Technical Notes:

- Uses recursive tree structure for representing chains
- Efficient O(n) algorithm for building chain structure
- Includes metadata about chain size and depth

Acceptance Criteria:

  1. [x] API returns complete chain structure starting from root story
  2. [x] Each story node includes its children and metadata
  3. [x] Response includes total story count and max depth
  4. [x] Proper validation of root story existence
  5. [x] Error handling for non-root stories
  6. [ ] Integration tests verify chain structure

References:

- Implementation details: tasks/work/sc-05-notes.md
- API documentation: src/content/story/presentation/story.controller.ts

## SC-06: Chain Visualization Algorithm

Metadata:
  Type: Feature
  Component: Backend
  Priority: Medium
  Status: Backlog

Dependencies:
  Blocked By: [SC-01, SC-05]
  Related: None

Description:
  Implement the core algorithm for transforming chain data into a visualizable tree structure format.

Requirements:

- Transform flat story data into hierarchical tree structure
- Calculate positional data for visual layout
- Optimize for frontend rendering performance
- Support different visualization modes (chronological, branch-focused)
- Handle large chains efficiently

Instructions:

  1. [ ] Define ChainVisualizationDto for the tree structure output
  2. [ ] Create ChainVisualizationService with transformation methods
  3. [ ] Implement algorithm to convert flat chain data to tree structure
  4. [ ] Add position calculation for visual layout coordinates
  5. [ ] Create GET /stories/{rootId}/visualization endpoint
  6. [ ] Implement caching for computed visualization data
  7. [ ] Optimize for performance with large chains
  8. [ ] Write unit tests for the transformation algorithm
  9. [ ] Document the visualization approach and API

Technical Notes:

- Use a depth-first traversal algorithm for tree construction
- Calculate x,y coordinates based on chain position and branch depth
- Consider using a modified Reingold-Tilford algorithm for tree layout
- Implement node collapsing for very large chains
- Cache visualization results with appropriate invalidation strategy
- Add pruning capabilities for visualization of partial chains

Acceptance Criteria:

  1. [ ] Story chain data is correctly transformed into tree structure
  2. [ ] Visualization format includes positional data for rendering
  3. [ ] Algorithm performs efficiently with large datasets (1000+ stories)
  4. [ ] Unit tests verify tree structure correctness
  5. [ ] Visualization data is suitable for frontend rendering
  6. [ ] API endpoint is documented with Swagger

References:

- Tree layout algorithms: <https://observablehq.com/@d3/tree>
- Similar concept: Git visualization tools

## SC-07: Story Chain Events Integration

Metadata:
  Type: Feature
  Component: Backend
  Priority: Medium
  Status: Backlog

Dependencies:
  Blocked By: [SC-01]
  Related: [SC-02, SC-03, SC-04]

Description:
  Implement event classes and handlers for story chain operations to integrate with recommendation and analytics systems.

Requirements:

- Define event schemas for story chain operations
- Implement event classes for story creation, continuation, and forking
- Create event handlers for recommendation system integration
- Add analytics tracking for chain operations
- Ensure reliable event delivery

Instructions:

  1. [ ] Define event schemas for StoryCreatedEvent, StoryContinuedEvent, and StoryForkedEvent
  2. [ ] Implement event classes with proper payload structures
  3. [ ] Create event handlers in the recommendation module
  4. [ ] Add analytics tracking for chain metrics
  5. [ ] Implement error handling and retry logic for event failures
  6. [ ] Create chain-specific metrics and events dashboard
  7. [ ] Write unit tests for event handlers
  8. [ ] Document the event integration approach

Technical Notes:

- Follow existing event schema patterns in ContentEventSchemas
- Include chain metadata in event payloads
- Use the existing event bus infrastructure
- Implement idempotent event handlers to prevent duplicate processing
- Add appropriate logging for event publishing and handling
- Consider implementing a dead-letter queue for failed events

Acceptance Criteria:

  1. [ ] Event schemas defined for all story chain operations
  2. [ ] Event classes correctly publish events to the event bus
  3. [ ] Recommendation system properly integrates with chain events
  4. [ ] Analytics system captures chain operation metrics
  5. [ ] Event handlers are idempotent and resilient to failures
  6. [ ] Unit tests verify event publishing and handling
  7. [ ] Integration tests confirm end-to-end event flow

References:

- Event schema pattern: src/common/event-manager/entities/events/schemas/content.events.ts
- Event bus: src/common/event-manager/services/event-bus.service.ts
