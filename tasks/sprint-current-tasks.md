# Sprint 013: Error Standardization and Notification Integration

## Sprint Information

**Goal**: Standardize error handling across the platform and enhance notification system integration to improve system reliability and user experience.

**Duration**: 2 weeks
**Story Points**: 24
**Team Velocity**: 20-25 points per sprint

## Selected Tasks

### ERR-001: Error Module Rollout (13 points)

**Status**: Almost Complete
**Priority**: Medium
**Risk Level**: Medium
**Story Points**: 13
**Sprint**: 013
**Change Type**: Enhancement

**Current Implementation**:

- Error module with standardized error handling implemented across all modules
- AppError base class fully implemented
- Error response decorator updated and standardized
- Module-specific implementations now consistent
- Documentation mostly complete with only frontend integration pending

**Tasks**:

1. [x] ERR-001.1: Module Error Analysis (3 points)
   - [x] Audit current error handling
   - [x] Document existing error types
   - [x] Identify common patterns
   - [x] Create migration plan
   - [x] Define error namespaces
   - [x] Write technical spec

2. [x] ERR-001.2: Social Module Migration (2 points)
   - [x] Create social error definitions
   - [x] Update error handling
   - [x] Migrate error responses
   - [x] Update documentation
   - [ ] Add integration tests
   - [x] Write migration guide

3. [x] ERR-001.3: User Module Migration (2 points)
   - [x] Create user error definitions
   - [x] Update error handling
   - [x] Migrate error responses
   - [x] Update documentation
   - [x] Add integration tests
   - [x] Write migration guide

4. [x] ERR-001.4: Content Module Migration (2 points)
   - [x] Create content error definitions
   - [x] Update error handling
   - [x] Migrate error responses
   - [x] Update documentation
   - [ ] Add integration tests
   - [x] Write migration guide

5. [x] ERR-001.5: Feed Module Migration (2 points)
   - [x] Create feed error definitions
   - [x] Update error handling
   - [x] Migrate error responses
   - [x] Update documentation
   - [ ] Add integration tests
   - [x] Write migration guide

6. [x] ERR-001.6: Notification Module Migration (2 points)
   - [x] Create notification error definitions
   - [x] Update error handling
   - [x] Migrate error responses
   - [x] Update documentation
   - [x] Add integration tests
   - [x] Write migration guide

7. [ ] ERR-001.7: Frontend Integration (2 points)
   - [ ] Update error handling
   - [ ] Create error components
   - [ ] Add i18n support
   - [ ] Setup error tracking
   - [ ] Add error recovery
   - [ ] Write component tests

**Technical Notes**:

- Follow error namespace conventions
- Maintain backward compatibility
- Add comprehensive documentation
- Include error examples
- Consider i18n requirements
- Plan for versioning
- Enforce consistent error response format across all modules

**Acceptance Criteria**:

- [x] All modules use new error system
- [ ] Error documentation is complete
- [x] API contracts are maintained
- [x] Tests pass successfully
- [ ] Frontend handles all errors
- [x] Migration guide available

### ERR-002: Complete Error Handler Migration (5 points)

**Status**: Backlog
**Priority**: High
**Risk Level**: Medium
**Story Points**: 5
**Sprint**: 014
**Change Type**: Refactoring

**Current Implementation**:

- Most modules have been migrated to the new error system (Social, User, Content, Feed, Notification)
- Some controllers may still be using legacy error handling components
- Need to verify complete migration across all business modules

**Tasks**:

1. [ ] ERR-002.1: Code Audit and Gap Analysis (1 point)
   - [ ] Create inventory of all controllers across business modules
   - [ ] Identify controllers still using legacy error components
   - [ ] Document required changes for each controller

2. [ ] ERR-002.2: Controller Migration (2 points)
   - [ ] Update imports to use new paths
   - [ ] Replace `RestExceptionFilter` with `GlobalErrorFilter`
   - [ ] Update `ErrorResponse` decorator to use module error constants
   - [ ] Ensure consistent error response format

3. [ ] ERR-002.3: Testing and Verification (1 point)
   - [ ] Create integration tests for error responses
   - [ ] Verify all controllers properly handle errors
   - [ ] Check Swagger documentation for completeness

4. [ ] ERR-002.4: Documentation Update (1 point)
   - [ ] Update API documentation with error response examples
   - [ ] Document migration process for future reference
   - [ ] Update development guidelines for error handling

**Technical Notes**:

- Only update error handling code - don't modify business logic
- Ensure backward compatibility for API clients
- Follow established patterns from modules already migrated
- Specific changes required:
  1. Update imports to use `GlobalErrorFilter` from `src/common/errors/error.filter.ts`
  2. Update imports to use `ErrorResponse` from `src/common/errors/decorators/error-response.decorator.ts`
  3. Replace `@UseFilters(RestExceptionFilter)` with `@UseFilters(GlobalErrorFilter)`
  4. Update `@ErrorResponse()` to use module error constants instead of strings

**Acceptance Criteria**:

- [ ] All controllers use the new error handling components
- [ ] API documentation correctly shows error responses
- [ ] Integration tests verify proper error handling
- [ ] No regression in error handling behavior
- [ ] Developer guidelines updated for error handling

## Technical Design: ERR-001 Error Module Rollout

### 1. Architecture Overview

The error module rollout will standardize error handling across all modules using the existing error system in `src/common/errors`. The architecture follows this pattern:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Base Errors   │────▶│  Module Errors  │────▶│  Error Handlers │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                       │
        │                        │                       │
        ▼                        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Error Factory  │     │  Serialization  │     │  Documentation  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 2. Current Implementation Analysis

The current error handling system has the following components:

- **Base Error System**
  - `AppError` base class in `src/common/errors/app.error.ts`:
    - Supports error code identification
    - Includes HTTP status codes
    - Provides message templating with params
    - Captures stack traces
    - Includes timestamp
    - Supports error chaining via cause
    - Has JSON serialization

- **Common Errors**
  - Pre-defined error definitions in `src/common/errors/common.errors.ts`
  - Helper function to create standard errors
  - Typed error codes for better IDE support

- **Error Handling**
  - Global error filter (`GlobalErrorFilter`)
  - Special handling for AppError vs HttpException
  - Consistent error response format
  - Error logging with context

- **Documentation**
  - `ErrorResponse` decorator for Swagger documentation
  - Groups errors by status code
  - Generates example responses
  - Creates OpenAPI schemas

- **Inconsistencies**
  - Some modules use legacy AppError from `src/common/models`
  - Error code naming is inconsistent across modules
  - Error factory patterns are not universally adopted
  - Incomplete documentation in some modules

### 3. Migration Strategy

#### 3.1 Error Code Standardization

We'll adopt a consistent naming convention for error codes:

```
module.category.code
```

Examples:

- `social.like.already_exists`
- `user.auth.not_found`
- `content.post.invalid_format`

This provides a clear namespace hierarchy and avoids collisions.

#### 3.2 Module-specific Error Structure

Each module will implement:

1. **Error Code Enum**:

```typescript
export enum SocialErrorCode {
  LIKE_ALREADY_EXISTS = 'social.like.already_exists',
  LIKE_FAILED = 'social.like.failed',
  UNLIKE_NOT_FOUND = 'social.unlike.not_found',
  COMMENT_NOT_FOUND = 'social.comment.not_found',
  // ...
}
```

2. **Error Map**:

```typescript
export const SOCIAL_ERRORS: Record<SocialErrorCode, ErrorDefinition> = {
  [SocialErrorCode.LIKE_ALREADY_EXISTS]: {
    message: 'Content already liked by this user',
    status: HttpStatus.BAD_REQUEST,
  },
  [SocialErrorCode.LIKE_FAILED]: {
    message: 'Failed to like content',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  // ...
};
```

3. **Error Classes**:

```typescript
export class SocialLikeAlreadyExistsError extends AppError {
  constructor(userId: string, contentId: string, contentType: string) {
    super(
      SocialErrorCode.LIKE_ALREADY_EXISTS,
      SOCIAL_ERRORS[SocialErrorCode.LIKE_ALREADY_EXISTS],
      {
        params: { userId, contentId, contentType },
      }
    );
  }
}
```

4. **Error Factory**:

```typescript
export class SocialErrorFactory {
  static likeAlreadyExists(
    userId: string,
    contentId: string,
    contentType: string
  ): SocialLikeAlreadyExistsError {
    return new SocialLikeAlreadyExistsError(userId, contentId, contentType);
  }
  
  // More factory methods...
}
```

#### 3.3 Implementation Steps for Each Module

1. **Analyze Current Errors**
   - Catalog all existing error types in the module
   - Map current error codes to new standardized format
   - Identify missing error types that should be added

2. **Create Error Files**
   - Create or update error codes enum
   - Define error definitions map
   - Implement error classes for each type
   - Create error factory

3. **Update Usage**
   - Find and update all error throwing sites
   - Replace direct error creation with factory methods
   - Ensure error parameters are properly passed

4. **Add Documentation**
   - Add JSDoc to all error classes
   - Update API controllers with ErrorResponse decorators
   - Add example responses in the API docs

5. **Write Tests**
   - Create unit tests for error creation
   - Test serialization and deserialization
   - Test error handling in controllers

#### 3.4 Backward Compatibility

To minimize disruption during migration:

1. Create a compatibility layer to handle legacy error codes
2. Add a mapping from old codes to new standardized codes
3. Update the global error filter to transform legacy errors
4. Add deprecation warnings for legacy error usage

### 4. Frontend Error Handling

#### 4.1 Error Handling Client

```typescript
export class ApiErrorHandler {
  static handleError(error: unknown): ErrorResponse {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as ErrorResponse;
      
      // Log to monitoring system
      ErrorMonitor.captureError({
        code: errorData.code,
        message: errorData.message,
        details: errorData.params,
        context: {
          url: error.config?.url,
          method: error.config?.method,
        },
      });
      
      return errorData;
    }
    
    // Handle unexpected errors
    return {
      code: 'client.unexpected_error',
      message: 'An unexpected error occurred',
      params: {},
      timestamp: new Date().toISOString(),
    };
  }
}
```

#### 4.2 Error Translation Component

```typescript
export const ErrorMessage: React.FC<{ error: ErrorResponse }> = ({ error }) => {
  const { t } = useTranslation();
  
  // Get translated message
  const message = useMemo(() => {
    return t(`errors.${error.code}`, {
      defaultValue: error.message,
      ...error.params,
    });
  }, [error, t]);
  
  return (
    <div className="error-message" data-error-code={error.code}>
      {message}
    </div>
  );
};
```

#### 4.3 Error Boundary Component

```typescript
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Send to error monitoring
    ErrorMonitor.captureException(error, { 
      extra: errorInfo,
      tags: { component: this.props.name || 'ErrorBoundary' },
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ? (
        this.props.fallback(this.state.error)
      ) : (
        <ErrorFallback error={this.state.error} />
      );
    }

    return this.props.children;
  }
}
```

### 5. Documentation Strategy

#### 5.1 Error Catalog Generation

Create a script to generate a comprehensive error catalog from code:

```typescript
export async function generateErrorCatalog(): Promise<ErrorCatalog> {
  const modules = await findAllModules();
  const catalog: ErrorCatalog = {};
  
  for (const module of modules) {
    const errors = await extractErrorsFromModule(module);
    catalog[module.name] = errors;
  }
  
  return catalog;
}
```

#### 5.2 Developer Guide

Create documentation for error handling best practices:

- When to use which error type
- How to create new error types
- Error handling patterns
- Testing error scenarios
- Frontend error handling

#### 5.3 API Error Documentation

Add a dedicated API errors section in the API documentation:

- List all possible error codes by endpoint
- Provide example error responses
- Include explanations and recovery actions

### 6. Testing Strategy

#### 6.1 Unit Tests

Each module should have comprehensive tests:

```typescript
describe('SocialErrorFactory', () => {
  describe('likeAlreadyExists', () => {
    it('should create error with correct parameters', () => {
      const userId = 'user-123';
      const contentId = 'content-456';
      const contentType = 'POST';
      
      const error = SocialErrorFactory.likeAlreadyExists(userId, contentId, contentType);
      
      expect(error).toBeInstanceOf(SocialLikeAlreadyExistsError);
      expect(error.code).toBe(SocialErrorCode.LIKE_ALREADY_EXISTS);
      expect(error.status).toBe(HttpStatus.BAD_REQUEST);
      expect(error.params).toEqual({ userId, contentId, contentType });
    });
  });
});
```

#### 6.2 Integration Tests

Test error handling at the API level:

```typescript
describe('SocialController (E2E)', () => {
  it('should return 400 when liking already liked content', async () => {
    // First like - should succeed
    await request(app.getHttpServer())
      .post('/social/like/POST/content-id')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);
    
    // Second like - should fail with ALREADY_LIKED error
    const response = await request(app.getHttpServer())
      .post('/social/like/POST/content-id')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(400);
    
    expect(response.body).toMatchObject({
      code: 'social.like.already_exists',
      message: expect.any(String),
    });
  });
});
```

### 7. Migration Process

1. **Prepare base infrastructure** (common errors, global filter)
2. **Migrate modules one by one** in the following order:
   - Social Module
   - User Module
   - Content Module
   - Feed Module
   - Notification Module
3. **Implement frontend error handling**

For each module migration:

- Create standardized error classes and factory
- Update controllers to use ErrorResponse decorator
- Replace direct error creation with factory methods
- Add tests for error handling
- Document all error codes and scenarios

## Technical Design: ERR-002 Error Handler Migration

### 1. Migration Overview

The ERR-002 task will complete the error handler migration across all business modules, ensuring:

1. All controllers use the standardized error handling components:
   - `GlobalErrorFilter` instead of `RestExceptionFilter`
   - New `ErrorResponse` decorator from `src/common/errors/decorators`
   - Module-specific error constants instead of string literals

2. Consistent behavior and documentation:
   - Error responses follow the standardized format
   - Swagger documentation accurately represents possible errors
   - Developers have clear guidelines for error handling

### 2. Migration Steps for Controllers

For each controller requiring migration:

```typescript
// BEFORE
import { RestExceptionFilter } from 'src/common/presentation/rest/rest-exception.filter';
import { ErrorResponse } from 'src/common/presentation/rest/decorators/error-response.decorator';

@Controller('resource')
@UseFilters(RestExceptionFilter)
@ErrorResponse('MODULE.ERROR_CODE')
export class ResourceController {
  // Controller methods
}

// AFTER
import { GlobalErrorFilter } from 'src/common/errors/error.filter';
import { ErrorResponse } from 'src/common/errors/decorators/error-response.decorator';
import { MODULE_ERRORS } from '../errors/module.errors';

@Controller('resource')
@UseFilters(GlobalErrorFilter)
@ErrorResponse(MODULE_ERRORS.ERROR_CODE)
export class ResourceController {
  // Controller methods
}
```

### 3. Verification Process

To verify successful migration:

1. **Static Analysis**: Run linter and TypeScript compiler to catch import errors
2. **Runtime Testing**: Execute integration tests to verify error responses
3. **Documentation Check**: Verify Swagger documentation for error responses

### 4. Implementation Guide

#### Step 1: Controller Analysis

Create a script to scan all controllers:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface ControllerAnalysis {
  filePath: string;
  needsMigration: boolean;
  issues: string[];
}

// Find all controller files
const controllerFiles = glob.sync('src/**/*.controller.ts');

// Analyze each controller
const analysis = controllerFiles.map(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  const needsMigration = 
    content.includes('RestExceptionFilter') ||
    content.includes('src/common/presentation/rest/decorators/error-response.decorator');
    
  const issues = [];
  if (content.includes('RestExceptionFilter')) {
    issues.push('Uses legacy RestExceptionFilter');
  }
  if (content.includes('src/common/presentation/rest/decorators/error-response.decorator')) {
    issues.push('Uses legacy ErrorResponse decorator');
  }
  
  return {
    filePath: file,
    needsMigration,
    issues
  };
});

// Output controllers needing migration
const controllersToMigrate = analysis.filter(a => a.needsMigration);
console.table(controllersToMigrate);
```

#### Step 2: Migration Implementation

For each controller needing migration:

1. **Update imports**:

```typescript
// Remove legacy imports
- import { RestExceptionFilter } from 'src/common/presentation/rest/rest-exception.filter';
- import { ErrorResponse } from 'src/common/presentation/rest/decorators/error-response.decorator';

// Add new imports
+ import { GlobalErrorFilter } from 'src/common/errors/error.filter';
+ import { ErrorResponse } from 'src/common/errors/decorators/error-response.decorator';
+ import { MODULE_ERRORS } from '../errors/module.errors';
```

2. **Update class decorators**:

```typescript
// Update controller decorators
- @UseFilters(RestExceptionFilter)
+ @UseFilters(GlobalErrorFilter)

// Update error response decorators
- @ErrorResponse('MODULE.ERROR_CODE')
+ @ErrorResponse(MODULE_ERRORS.ERROR_CODE)
```

3. **Update method decorators** (if any):

```typescript
// Update method decorators
- @ErrorResponse('MODULE.SPECIFIC_ERROR')
+ @ErrorResponse(MODULE_ERRORS.SPECIFIC_ERROR)
```

#### Step 3: Testing and Verification

1. **Integration tests** for error responses:

```typescript
describe('ErrorHandler Migration (E2E)', () => {
  it('should return formatted error for not found resource', async () => {
    const response = await request(app.getHttpServer())
      .get('/resource/non-existent-id')
      .expect(404);
    
    expect(response.body).toMatchObject({
      code: expect.stringMatching(/^module\.\w+\.not_found$/),
      message: expect.any(String),
      timestamp: expect.any(String),
    });
  });
});
```

#### Step 4: Documentation Updates

1. **Update API documentation**:

```typescript
/**
 * @api {get} /resource/:id Get resource by ID
 * @apiName GetResource
 * @apiGroup Resource
 * @apiParam {String} id Resource unique ID
 * @apiSuccess {Object} resource Resource object
 * @apiError (404) {Object} NotFound Resource not found
 * @apiErrorExample {json} NotFound:
 * {
 *   "code": "module.resource.not_found",
 *   "message": "Resource with ID '123' not found",
 *   "timestamp": "2023-07-15T10:30:45.123Z"
 * }
 */
```

2. **Update developer guidelines**:

```markdown
# Error Handling Guidelines

## Controller Error Handling

All controllers should use the standardized error handling:

```typescript
import { GlobalErrorFilter } from 'src/common/errors/error.filter';
import { ErrorResponse } from 'src/common/errors/decorators/error-response.decorator';
import { MODULE_ERRORS } from '../errors/module.errors';

@Controller('resource')
@UseFilters(GlobalErrorFilter)
@ErrorResponse(MODULE_ERRORS.DEFAULT)
export class ResourceController {
  // Methods
}
```

## Available Error Types

Each module has its own error definitions in `src/[module]/errors/[module].errors.ts`.

```

## Implementation Strategy

### Week 1

1. [x] **ERR-001.1: Module Error Analysis**
   - [x] Audit current error handling
   - [x] Define error namespaces
   - [x] Create base error classes

2. [x] **NOT-004.1: User Module Integration**
   - [x] Implement preference management
   - [x] Add API endpoints
   - [x] Setup caching

3. [x] **ERR-001.2-3: Social & User Module Migration**
   - [x] Create error definitions
   - [x] Update error handling
   - [x] Document API errors

### Week 2

1. [x] **NOT-004.2: Social Module Integration**
   - [x] Implement event handlers
   - [x] Create notification templates
   - [x] Setup aggregation rules

2. [x] **ERR-001.4-6: Content, Feed & Notification Module Migration**
   - [x] Create error definitions
   - [x] Update error handling
   - [x] Add documentation

3. [ ] **ERR-001.7 & NOT-004.3: Frontend Integration**
   - [ ] Implement error components
   - [ ] Create notification center
   - [ ] Add real-time updates

## Testing Strategy

1. **Unit Tests**:
   - Test error creation and serialization
   - Verify notification preference management
   - Test event handlers

2. **Integration Tests**:
   - Test error propagation
   - Verify notification delivery
   - Test preference application

3. **Frontend Tests**
   - Test UI components
   - Verify real-time updates
   - Test offline behavior

## Quality Requirements

1. **Error Handling**:
   - Consistent error format
   - Comprehensive error documentation
   - Proper error propagation

2. **Notification Delivery**:
   - Real-time delivery
   - Proper aggregation
   - Respect user preferences

3. **Frontend Experience**:
   - Intuitive notification center
   - Clear error messages
   - Mobile-friendly design

## Documentation Requirements

1. **Error System**:
   - Error code documentation
   - Error handling guide
   - Migration documentation

2. **Notification System**:
   - Notification template guide
   - Preference management documentation
   - Integration guide

## Sprint Success Criteria

1. [x] Error module successfully rolled out to all business modules
2. [x] Notification module integrated with social and user modules
3. [ ] Frontend components implemented for both error handling and notifications
4. [ ] Comprehensive documentation completed
5. [x] All backend tests passing

## Sprint 013 Planning Summary

### Sprint Overview

**Sprint Goal**: Standardize error handling across the platform and enhance notification system integration to improve system reliability and user experience.

**Story Points Planned**: 24/24
**Team Velocity**: 20-25 points per sprint

### Key Focuses

1. **Error Standardization**
   - Implement consistent error handling across all modules
   - Standardize error responses for better frontend integration
   - Enhance error tracking and reporting

2. **Notification System Enhancement**
   - Integrate notification system with user preferences
   - Connect social module events to notification system
   - Implement real-time frontend components

### Risk Assessment

1. **High-Risk Areas**
   - Error module integration with existing code
   - Real-time notification delivery
   - Frontend components compatibility

2. **Mitigation Strategies**
   - Incremental module migration with comprehensive testing
   - Performance testing for notification system
   - Component isolation for frontend development

### Dependencies

1. **Internal Dependencies**
   - Completed event system migration (EVT-002)
   - Notification delivery optimization (NOT-003.5)
   - Notification cache enhancement (NOT-003.6)

2. **External Dependencies**
   - Redis for caching and real-time communication
   - WebSocket infrastructure for frontend integration

### Success Metrics

1. **Performance Metrics**
   - Error response time < 50ms
   - Notification delivery time < 500ms
   - Frontend component render time < 100ms

2. **Quality Metrics**
   - Test coverage > 85%
   - Code quality score > 8/10
   - Documentation completeness > 90%

### Team Assignments

**Error Module Rollout (ERR-001)**

- Module Analysis: Backend Team
- Module Migration: Backend Team
- Frontend Integration: Frontend Team

**Notification Module Integration (NOT-004)**

- User Module Integration: Backend Team
- Social Module Integration: Backend Team
- Frontend Integration: Frontend Team

## Sprint 014 Preview

### Upcoming Tasks

1. **Complete Error Handler Migration (ERR-002)**
   - Ensure all controllers are using the standardized error system
   - Finish any remaining migration work
   - Complete integration tests for error handling
   - Update documentation

2. **Frontend Error Handling Integration**
   - Implement frontend error handling components
   - Create standardized error message display
   - Add i18n support for error messages
   - Setup error tracking and monitoring

### Key Focus Areas

- Completing the error standardization across all parts of the system
- Enhancing developer experience with comprehensive error documentation
- Improving user experience with better error handling on frontend
- Ensuring all modules maintain consistent error patterns
