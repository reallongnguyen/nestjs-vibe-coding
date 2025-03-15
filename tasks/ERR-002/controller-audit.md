# Controller Error Handler Migration Audit

## Overview

This document catalogs all controllers that need to be migrated from the legacy error handling system to the new standardized error handling system.

## Required Changes

For each controller, the following changes are required:

1. Update imports:
   - Remove: `import { RestExceptionFilter } from 'src/common/presentation/rest/rest-exception.filter';` or `import { RestExceptionFilter } from 'src/common';`
   - Remove: `import { ErrorResponse } from 'src/common/presentation/rest/decorators/error-response.decorator';` or `import { ErrorResponse } from 'src/common';`
   - Add: `import { GlobalErrorFilter } from 'src/common/errors/error.filter';`
   - Add: `import { ErrorResponse } from 'src/common/errors/decorators/error-response.decorator';`

2. Update decorators:
   - Replace: `@UseFilters(new RestExceptionFilter(errorMap))` with `@UseFilters(GlobalErrorFilter)`
   - Replace: `@ErrorResponse('string')` with `@ErrorResponse(MODULE_ERRORS)`

3. Import module-specific error constants if not already imported.

## Controllers Requiring Migration

### App Module

- [x] AppController (`src/app.controller.ts`)
  - ~~Using `RestExceptionFilter` with `{}`~~
  - ~~No `ErrorResponse` decorator~~
  - **MIGRATED**: Now using `GlobalErrorFilter`

### Common Module

- [x] MetricsController (`src/common/monitoring/metrics.controller.ts`)
  - ~~Using `RestExceptionFilter` with `commonErrorMap`~~
  - ~~Using `ErrorResponse` from legacy path~~
  - **MIGRATED**: Now using `GlobalErrorFilter` and `ErrorResponse` from new path with `COMMON_ERRORS`

### Content Module

- [x] DraftPostController (`src/content/presentation/draft-post.controller.ts`)
  - ~~Using `RestExceptionFilter` with `contentErrorMap`~~
  - ~~Using `ErrorResponse` from legacy path~~
  - **MIGRATED**: Now using `GlobalErrorFilter` and `ErrorResponse` from new path with `CONTENT_ERRORS`

- [x] PublishedPostController (`src/content/presentation/published-post.controller.ts`)
  - ~~Using `RestExceptionFilter` with `contentErrorMap`~~
  - ~~Using `ErrorResponse` from legacy path~~
  - **MIGRATED**: Now using `GlobalErrorFilter` and `ErrorResponse` from new path with `CONTENT_ERRORS`

### Storage Module

- [x] FileController (`src/storage/file.controller.ts`)
  - ~~Using `RestExceptionFilter` with `fileErrorMap`~~
  - ~~Using `ErrorResponse` from legacy path~~
  - **MIGRATED**: Now using `GlobalErrorFilter` and `ErrorResponse` from new path with `STORAGE_ERRORS`

- [x] ImageProxyController (`src/storage/image-proxy.controller.ts`)
  - ~~Using `RestExceptionFilter` with `fileErrorMap`~~
  - ~~Using `ErrorResponse` from legacy path~~
  - **MIGRATED**: Now using `GlobalErrorFilter` and `ErrorResponse` from new path with `STORAGE_ERRORS`

### Gamification Module

- [x] EmotionController (`src/gamification/presentation/emotion.controller.ts`)
  - ~~Using `RestExceptionFilter` with `emotionErrorMap`~~
  - ~~Using `ErrorResponse` from legacy path~~
  - **MIGRATED**: Now using `GlobalErrorFilter` and `ErrorResponse` from new path with `GAMIFICATION_ERRORS`

- [x] StreakController (`src/gamification/presentation/streak.controller.ts`)
  - ~~Using `RestExceptionFilter` with `emotionErrorMap`~~
  - ~~Using `ErrorResponse` from legacy path~~
  - **MIGRATED**: Now using `GlobalErrorFilter` and `ErrorResponse` from new path with `GAMIFICATION_ERRORS`

### Notification Module

- [x] NotificationController (`src/notification/presentation/notification.controller.ts`)
  - ~~Using `RestExceptionFilter` with `NOTIFICATION_ERRORS`~~
  - ~~Using `ErrorResponse` from legacy path~~
  - **MIGRATED**: Now using `GlobalErrorFilter` and `ErrorResponse` from new path with `NOTIFICATION_ERRORS`

- [x] NotificationTemplateController (`src/notification/presentation/notification-template.controller.ts`)
  - ~~Using `RestExceptionFilter` with `NOTIFICATION_ERRORS`~~
  - ~~Using `ErrorResponse` from legacy path~~
  - **MIGRATED**: Now using `GlobalErrorFilter` and `ErrorResponse` from new path with `NOTIFICATION_ERRORS`

- [x] NotificationPreferenceController (`src/notification/presentation/notification-preference.controller.ts`)
  - ~~Using `RestExceptionFilter` with `notificationErrorMap`~~
  - ~~Using `ErrorResponse` from legacy path~~
  - **MIGRATED**: Now using `GlobalErrorFilter` and `ErrorResponse` from new path with `NOTIFICATION_ERRORS`

### Identity Module

- [ ] UserController (`src/identity/presentation/user.controller.ts`)
  - Using `RestExceptionFilter` with `IDENTITY_ERRORS`
  - Using `ErrorResponse` from legacy path

- [ ] UserProfileController (`src/identity/presentation/user-profile.controller.ts`)
  - Using `RestExceptionFilter` with `userErrorMap`
  - Using `ErrorResponse` from legacy path

## Migration Status

- [x] App Module (1/1 controllers migrated)
- [x] Common Module (1/1 controllers migrated)
- [x] Content Module (2/2 controllers migrated)
- [x] Storage Module (2/2 controllers migrated)
- [x] Gamification Module (2/2 controllers migrated)
- [x] Notification Module (3/3 controllers migrated)
- [ ] Identity Module (0/2 controllers migrated)
- [ ] Total: 11/13 controllers migrated
