# End-to-End Testing Guide

This document provides guidelines for running and maintaining end-to-end (E2E) tests for the API service.

## Setup

The E2E tests are configured in the following files:

- `jest-e2e.json`: Jest configuration for E2E tests
- `jest-global-setup.ts`: Setup that runs before all tests
- `jest-global-teardown.ts`: Teardown that runs after all tests
- `jest-setup.ts`: Setup that runs before each test file

## Running Tests

### Running All E2E Tests

```bash
npm run test:e2e
```

### Running Specific Tests

```bash
npm run test:e2e -- test/e2e/content/content-recovery.e2e-spec.ts
```

### Running Tests in Debug Mode

```bash
npm run test:e2e:debug
```

## Common Issues and Solutions

### Tests Hanging or Not Terminating

If tests are not terminating properly, it's usually because of:

1. **Database connections remaining open**:
   - Ensure `teardownTestApp()` is used in the `afterAll` hook
   - Make sure all PrismaService instances are properly disconnected

2. **Event listeners not being removed**:
   - Check for event listeners that might not be removed in test code
   - Use `events.removeAllListeners()` if necessary

3. **Active timers**:
   - Make sure all `setTimeout` and `setInterval` calls are cleared
   - Use `clearTimeout` and `clearInterval`

4. **Missing await on async operations**:
   - Always await asynchronous operations, especially in test hooks

### Troubleshooting Steps

1. **Run with detectOpenHandles**:

   ```bash
   npm run test:e2e -- --detectOpenHandles
   ```

2. **Enable Jest debug logging**:

   ```bash
   NODE_DEBUG=jest npm run test:e2e
   ```

3. **Check for database connection issues**:

   ```bash
   NODE_DEBUG=prisma npm run test:e2e
   ```

4. **Force tests to exit**:

   ```bash
   npm run test:e2e -- --forceExit
   ```

## Best Practices

1. **Always clean up resources**:
   - Use `afterEach` or `afterAll` hooks to clean up resources
   - Use `teardownTestApp()` for proper app and database cleanup

2. **Isolate tests**:
   - Each test should be independent and not rely on state from other tests
   - Use `beforeEach` to set up test data

3. **Handle async operations properly**:
   - Always await async operations
   - Use `try/catch` blocks to handle errors properly

4. **Mock external dependencies**:
   - Use mocks for external services
   - Avoid making real HTTP requests to external services

## Testing with Skipped Tests

Some tests are currently skipped due to auth system integration issues. These tests are marked with `.skip` and will be enabled once the issues are resolved.

## Updating Tests

When adding new tests:

1. Import the `teardownTestApp` function
2. Use it in the `afterAll` hook
3. Make sure all async operations are properly awaited
4. Keep tests isolated and independent
