/* eslint-disable no-console */
// This file is executed before each test file
jest.setTimeout(20000); // Set timeout to 20 seconds

// Mock the logger
jest.mock('nestjs-pino', () => {
  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  return {
    Logger: jest.fn().mockImplementation(() => mockLogger),
    InjectPinoLogger: jest.fn(),
    Params: jest.fn(),
    PinoLogger: jest.fn().mockImplementation(() => mockLogger),
    PinoLoggerModule: {
      forRoot: jest.fn().mockReturnValue({
        module: class PinoLoggerModule {},
        providers: [],
      }),
      forRootAsync: jest.fn().mockReturnValue({
        module: class PinoLoggerModule {},
        providers: [],
      }),
    },
  };
});

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
