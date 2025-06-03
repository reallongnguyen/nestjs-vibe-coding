# Documenting API Error Responses for Swagger

## Introduction

Consistent and clear documentation of API error responses is crucial for effective frontend and backend integration. It allows consumers of the API to understand potential failure modes and handle them gracefully. The `@ApiAppErrors` decorator provides a standardized way to document application-specific errors in Swagger (OpenAPI) specifications, leveraging a central error registry.

This decorator simplifies the process of adding multiple `@ApiResponse` entries for various error statuses that an endpoint might return, ensuring that our Swagger documentation is informative and accurately reflects the API's behavior.

## Components

The error documentation system using `@ApiAppErrors` consists of a few key components:

### 1. `@ApiAppErrors(errorCodes: string[])` Decorator

This is the primary tool for documenting errors on your controller methods.

-   **Import:**
    ```typescript
    import { ApiAppErrors } from 'src/common/swagger/api-app-errors.decorator';
    ```
-   **Usage:** Apply it directly to your controller methods, passing an array of error code strings. These error codes should correspond to entries in the `ALL_APP_ERRORS` registry.

-   **Example:**
    ```typescript
    import { Controller, Get, Query } from '@nestjs/common';
    import { ApiOperation } from '@nestjs/swagger';
    import { ApiAppErrors } from 'src/common/swagger/api-app-errors.decorator';
    import { CommonErrorCode } from 'src/common/errors/common.error-codes'; // Assuming CommonErrorCode is an enum
    import { FeedErrorCode } from 'src/feed/errors/feed.error-codes';    // Assuming FeedErrorCode is an enum from feed module

    // ... other necessary imports for MyDto, MyResponseDto ...

    @Controller('example')
    export class ExampleController {
      @Get('my-endpoint')
      @ApiOperation({ summary: 'Demonstrates documented error responses' })
      @ApiAppErrors([
        CommonErrorCode.AUTH_INVALID_TOKEN,     // Example: "common.auth.invalid-token"
        FeedErrorCode.FEED_GENERATION_FAILED, // Example: "feed.generation.failed"
        'some.other.module.SPECIFIC_ERROR_CODE' // Direct string for un-enum-ed codes
      ])
      async myEndpoint(@Query() queryParams: any /* MyDto */): Promise<any /* MyResponseDto */> {
        // Endpoint logic that might throw AppError instances with these codes
        // For example:
        // if (someCondition) {
        //   throw new AppError(CommonErrorCode.AUTH_INVALID_TOKEN, COMMON_ERRORS[CommonErrorCode.AUTH_INVALID_TOKEN]);
        // }
        // if (anotherCondition) {
        //   throw new AppError(FeedErrorCode.FEED_GENERATION_FAILED, FEED_ERRORS[FeedErrorCode.FEED_GENERATION_FAILED]);
        // }
        return { message: 'Success!' };
      }
    }
    ```

### 2. `ALL_APP_ERRORS` Registry

-   **Location:** `src/common/errors/error-registry.ts`
-   **Purpose:** This file exports a constant `ALL_APP_ERRORS`. It's a comprehensive JavaScript object that merges error definitions (error code, message, HTTP status) from all modules within the application.
-   **How it works:** The `@ApiAppErrors` decorator uses this registry to look up the details (status, default message) for each error code you provide.
-   **Developer Responsibility:** When adding new error types to a module (e.g., new errors in `FEED_ERRORS` in `src/feed/errors/feed.errors.ts`), developers **must** ensure that their module's error definition object is correctly imported and spread into the `ALL_APP_ERRORS` object in `error-registry.ts`. This makes them available to the decorator.

    ```typescript
    // Example snippet from src/common/errors/error-registry.ts
    // ... other imports ...
    // import { FEED_ERRORS } from '../../feed/errors/feed.errors'; // Ensure your module's errors are here

    export const ALL_APP_ERRORS: Record<string, ErrorDefinition> = {
      ...COMMON_ERRORS,
      // ...FEED_ERRORS, // Your module's errors must be spread here
      // ... other module errors
    };
    ```

### 3. `ApiErrorResponseDto`

-   **Location:** `src/common/presentation/rest/dto/api-error-response.dto.ts`
-   **Purpose:** This Data Transfer Object (DTO) defines the standardized structure for all JSON error responses. The `@ApiAppErrors` decorator uses this DTO as the `type` for the generated `@ApiResponse` decorators, ensuring that Swagger UI accurately displays the error response schema.
-   **Structure:**
    ```typescript
    export class ApiErrorResponseDto {
      code: string;       // e.g., "USER_NOT_FOUND"
      message: string;    // e.g., "User was not found"
      params?: Record<string, unknown>; // Optional additional context
      timestamp: string;  // ISO 8601 date-time
    }
    ```

## Swagger Output & Internationalization (i18n)

When you use `@ApiAppErrors`, it automatically generates an `@ApiResponse` decorator for each error code you list.

-   **Generated Documentation:** For each error code, Swagger will show:
    -   The **HTTP Status Code** (e.g., 401, 404, 500) as defined in `ALL_APP_ERRORS`.
    -   A **Description** field formatted like:
        `Error Code: YOUR_ERROR_CODE. Message: The default message for this error. (Note: This message can be internationalized by the client using the error code).`
    -   The **Response Body Schema** will match `ApiErrorResponseDto`.
    -   An **Example Value** for the response body, like:
        ```json
        {
          "code": "YOUR_ERROR_CODE",
          "message": "The default message for this error.",
          "timestamp": "2023-10-27T12:00:00.000Z"
        }
        ```

-   **Internationalization (i18n) Key:**
    The most important aspect for client-side error handling and internationalization is the `code` field (e.g., `CommonErrorCode.AUTH_INVALID_TOKEN`, which might resolve to a string like `"common.auth.invalid-token"`). Frontend teams should use this **error code string** as the key to look up localized error messages in their i18n libraries. The `message` provided in the API response can serve as a fallback or for logging purposes but should not be directly displayed to end-users if internationalization is a concern.

## Example Usage (Expanded)

Let's revisit the controller example to see how different components connect:

```typescript
// src/modules/example/example.controller.ts
import { Controller, Get, Query, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

// 1. Import the decorator
import { ApiAppErrors } from 'src/common/swagger/api-app-errors.decorator';

// 2. Import ErrorCode enums (or use string literals if enums aren't available for a specific code)
// Assuming CommonErrorCode and FeedErrorCode are enums that map to string codes
import { CommonErrorCode } from 'src/common/errors/common.error-codes';
import { FeedErrorCode } from 'src/feed/errors/feed.error-codes';

// (Illustrative: These would be your actual DTOs)
class MyDto {}
class MyResponseDto {}

@ApiTags('Example Module')
@Controller('example')
export class ExampleController {
  @Get('my-endpoint')
  @ApiOperation({ summary: 'Does something interesting and might fail in specific ways' })
  // 3. Use the decorator with specific error codes relevant to this endpoint
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,        // e.g., "common.auth.invalid-token"
    CommonErrorCode.VALIDATION_FAILED,         // e.g., "common.validation.failed"
    FeedErrorCode.FEED_GENERATION_FAILED,    // e.g., "feed.generation.failed"
    'project.SPECIFIC_MODULE_ERROR'          // Example of a non-enum based error code
  ])
  async myEndpoint(@Query() queryParams: MyDto): Promise<MyResponseDto> {
    // Imagine your logic here:
    // if (!isValidToken(queryParams.token)) {
    //   throw new AppError(CommonErrorCode.AUTH_INVALID_TOKEN, COMMON_ERRORS[CommonErrorCode.AUTH_INVALID_TOKEN]);
    // }
    // if (validationFails(queryParams)) {
    //   throw new AppError(CommonErrorCode.VALIDATION_FAILED, COMMON_ERRORS[CommonErrorCode.VALIDATION_FAILED], { fields: ['field1', 'field2'] });
    // }
    // try {
    //   const feed = await this.feedService.generateFeed(queryParams.userId);
    //   return feed;
    // } catch (error) {
    //   // Assuming feedService throws an AppError with FeedErrorCode.FEED_GENERATION_FAILED
    //   throw error;
    // }
    // if (someOtherCondition()) {
    //   throw new AppError('project.SPECIFIC_MODULE_ERROR', SPECIFIC_MODULE_ERRORS['project.SPECIFIC_MODULE_ERROR']);
    // }

    return { data: 'Operation successful!' } as any; // Replace with actual response
  }
}
```

**Explanation of the example:**
- The `@ApiAppErrors` decorator lists potential error codes this endpoint can return.
- `CommonErrorCode.AUTH_INVALID_TOKEN` might be thrown if authentication fails (typically handled by guards, but shown here for illustration).
- `CommonErrorCode.VALIDATION_FAILED` might be thrown by a validation pipe or service if input data is incorrect.
- `FeedErrorCode.FEED_GENERATION_FAILED` could be thrown if a call to a feed generation service fails.
- `'project.SPECIFIC_MODULE_ERROR'` shows how you can use a string literal if the error code isn't part of an enum (though enums are preferred for better maintainability).

Swagger will then display four distinct error responses (e.g., 401 for `AUTH_INVALID_TOKEN`, 400 for `VALIDATION_FAILED`, 500 for `FEED_GENERATION_FAILED`, etc.), each with its code, default message, and the `ApiErrorResponseDto` schema.

## Best Practices

-   **Be Specific:** Only include error codes in `@ApiAppErrors` that your endpoint can realistically and directly return, or that can bubble up from services it directly uses. Avoid listing every possible error in the system.
-   **Keep Updated:** API behavior changes. If you modify the error handling of an endpoint (add new errors, remove old ones, change error codes), always update the `@ApiAppErrors` decorator to reflect these changes. Accurate documentation is key.
-   **Use Error Code Enums:** Whenever possible, use enums (like `CommonErrorCode`, `FeedErrorCode`) for error codes rather than raw strings. This improves type safety and refactorability.
-   **Verify `ALL_APP_ERRORS`:** Ensure any new module-level error collections (e.g., `USER_SETTINGS_ERRORS`) are correctly added to the `ALL_APP_ERRORS` registry in `src/common/errors/error-registry.ts`. Otherwise, the decorator won't find their definitions.

By following these guidelines, you can effectively document your API's error responses, making integration smoother for all consumers.
