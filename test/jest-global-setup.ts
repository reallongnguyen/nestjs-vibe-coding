/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
// Global setup for Jest E2E tests
export default async (): Promise<void> => {
  // Set global flags
  (global as any).__TEST_GLOBAL_SETUP_COMPLETE__ = true;

  console.log('Global setup complete');
};
