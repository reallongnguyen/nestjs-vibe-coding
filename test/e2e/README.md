# Error Standardization E2E Testing Guide

This guide explains how to run and extend the end-to-end tests for validating the error standardization implementation across all modules.

## Test Structure

The E2E tests are organized by module:

```
test/
├── e2e/
│   ├── user/            # User module tests
│   ├── social/          # Social module tests
│   ├── content/         # Content module tests
│   ├── feed/            # Feed module tests
│   └── README.md        # This file
└── utils/
    ├── error-testing.utils.ts    # Error testing utilities
    └── test-setup.utils.ts       # Test environment setup utilities
```

## Running the Tests

To run all E2E tests:

```bash
npm run test:e2e
```

To run tests for a specific module:

```bash
npm run test:e2e -- test/e2e/user
```

To run a specific test file:

```bash
npm run test:e2e -- test/e2e/user/user.e2e-spec.ts
```

## Test Environment

The E2E tests use a dedicated test database to avoid affecting development or production data. Make sure to configure the following environment variables:

```
# .env.test
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
```

## Test Utilities

### Error Testing Utilities

The `error-testing.utils.ts` file provides standardized functions for testing error responses:

- `testErrorScenario`: Tests an API endpoint with expected error response
- `measureErrorResponseTime`: Tests error response time against performance requirements
- `validateErrorResponse`: Validates error response structure

### Test Setup Utilities

The `test-setup.utils.ts` file provides utilities for setting up the test environment:

- `setupTestApp`: Creates a configured NestJS application for testing
- `cleanDatabase`: Cleans the test database between tests
- `seedTestData`: Seeds test data for specific modules

## Adding New Tests

When adding tests for a new error scenario:

1. Create a test file in the appropriate module directory if it doesn't exist
2. Use the `testErrorScenario` function to test the error response
3. Follow the existing patterns for test organization

Example:

```typescript
// test/e2e/content/content.e2e-spec.ts
describe('Content error scenarios', () => {
  it('should return 404 when post not found', () => {
    return testErrorScenario(
      app,
      'get',
      '/content/posts/non-existent-id',
      404,
      'content.post.notFound'
    );
  });
});
```

## Testing Error Propagation

For testing error propagation between modules, create tests that trigger scenarios where errors originate in one module but appear in another:

```typescript
it('should propagate user errors to social module', () => {
  return testErrorScenario(
    app,
    'get',
    '/social/profile/non-existent-user',
    404,
    'user.profile.notFound'
  );
});
```

## Performance Testing

Use the `measureErrorResponseTime` function to verify that error responses meet performance requirements:

```typescript
it('should handle not found error within performance limits', async () => {
  await measureErrorResponseTime(
    app,
    'get',
    '/users/non-existent-id',
    404,
    'user.profile.notFound',
    50 // Max response time in ms
  );
});
```

## Test Results Analysis

After running the tests:

1. Verify that all error responses follow the standard format
2. Check that error codes are properly namespace-prefixed
3. Confirm that error propagation works correctly
4. Validate performance metrics
5. Document any inconsistencies or issues found

## Common Issues and Solutions

### Missing Error Codes

If tests fail with unexpected error codes, check:

- Error code definitions in the module's error files
- Error factory implementation
- Controller error handling

### Performance Issues

If performance tests fail:

- Check for inefficient database queries
- Look for missing indexes
- Verify error logging implementation
- Check for unnecessary operations in error handling

## Reporting

After completing all tests, generate a comprehensive report including:

1. Summary of test results by module
2. List of any failed tests and reasons
3. Performance metrics
4. Recommendations for improvements
5. Examples of verified error responses
