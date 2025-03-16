/* eslint-disable no-console */
// This file is executed before each test file
jest.setTimeout(20000); // Set timeout to 20 seconds

// Add custom matchers or other Jest configurations here
beforeAll(() => {
  console.log('Setting up test environment...');
});

// Clean up after all tests in each file
afterAll(() => {
  // Add a delay to ensure all resources are cleaned up
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 500);
  });
});
