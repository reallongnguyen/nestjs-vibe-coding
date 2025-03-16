/* eslint-disable no-console */
// Global teardown for Jest E2E tests
export default async (): Promise<void> => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  // Add a small delay to ensure all resources are released
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 1000);
  });

  console.log('Global teardown complete');
};
