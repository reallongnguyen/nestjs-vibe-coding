# Error Handling Migration Guide

## Overview

This document describes the migration of controllers to use the new standardized error handling system. The migration involves updating controllers to use the new `GlobalErrorFilter` and `ErrorResponse` decorator from the `src/common/errors` module.

## Migration Steps

### 1. Update Imports

Replace legacy imports with the new ones:

```typescript
// BEFORE
import { RestExceptionFilter } from 'src/common/presentation/rest/rest-exception.filter';
import { ErrorResponse } from 'src/common/presentation/rest/decorators/error-response.decorator';

// AFTER
import { GlobalErrorFilter } from 'src/common/errors/error.filter';
import { ErrorResponse } from 'src/common/errors/decorators/error-response.decorator';
import { MODULE_ERRORS } from '../errors/module.errors'; // Import module-specific errors
```

### 2. Update Controller Decorators

Replace the legacy filter and error response decorators:

```typescript
// BEFORE
@Controller('resource')
@UseFilters(RestExceptionFilter)
@ErrorResponse('MODULE.ERROR_CODE')
export class ResourceController {
  // Controller methods
}

// AFTER
@Controller('resource')
@UseFilters(GlobalErrorFilter)
@ErrorResponse(MODULE_ERRORS.ERROR_CODE)
export class ResourceController {
  // Controller methods
}
```

### 3. Update Method Decorators (if any)

If you have method-level error response decorators, update them as well:

```typescript
// BEFORE
@Get(':id')
@ErrorResponse('MODULE.SPECIFIC_ERROR')
findOne(@Param('id') id: string) {
  // Method implementation
}

// AFTER
@Get(':id')
@ErrorResponse(MODULE_ERRORS.SPECIFIC_ERROR)
findOne(@Param('id') id: string) {
  // Method implementation
}
```

## Verification

To verify that all controllers have been migrated, you can run the controller analysis script:

```bash
npx ts-node controller-analysis.ts
```

This script will scan all controller files and report any that still need migration.

## Benefits of the New Error Handling System

1. **Standardized Error Format**: All errors follow a consistent format with code, message, and timestamp.
2. **Type Safety**: Error codes are defined as enums, providing better type safety and IDE support.
3. **Better Documentation**: The new system generates better Swagger documentation for error responses.
4. **Improved Error Handling**: The new system provides better error handling with support for error chaining and context.
5. **Centralized Error Management**: All error definitions are centralized in module-specific error files.

## Module-Specific Error Files

Each module should have its own error definitions file with the following structure:

```typescript
// src/module/errors/module.errors.ts

export enum ModuleErrorCode {
  NOT_FOUND = 'module.resource.not_found',
  INVALID_INPUT = 'module.resource.invalid_input',
  // More error codes...
}

export const MODULE_ERRORS: Record<ModuleErrorCode, ErrorDefinition> = {
  [ModuleErrorCode.NOT_FOUND]: {
    message: 'Resource not found',
    status: HttpStatus.NOT_FOUND,
  },
  [ModuleErrorCode.INVALID_INPUT]: {
    message: 'Invalid input data',
    status: HttpStatus.BAD_REQUEST,
  },
  // More error definitions...
};

export class ModuleErrorFactory {
  static notFound(id: string): AppError {
    return new AppError(
      ModuleErrorCode.NOT_FOUND,
      MODULE_ERRORS[ModuleErrorCode.NOT_FOUND],
      { params: { id } }
    );
  }
  
  // More factory methods...
}
```

## Testing Error Responses

To test error responses, you can use the following pattern:

```typescript
describe('ResourceController (E2E)', () => {
  it('should return 404 when resource not found', async () => {
    const response = await request(app.getHttpServer())
      .get('/resource/non-existent-id')
      .expect(404);
    
    expect(response.body).toMatchObject({
      code: ModuleErrorCode.NOT_FOUND,
      message: expect.any(String),
      timestamp: expect.any(String),
    });
  });
});
```
