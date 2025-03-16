/* eslint-disable no-console */
import {
  INestApplication,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { GlobalErrorFilter } from '../../src/common/errors/error.filter';
import { AppModule } from '../../src/app.module';

/**
 * Creates a fully configured NestJS application for E2E testing
 * @param modules Optional array of modules to include (defaults to AppModule)
 * @param globalPrefix The global prefix for the application
 * @returns The configured NestJS application
 */
export async function setupTestApp(
  modules: any[] = [AppModule],
  globalPrefix = 'api/v1',
): Promise<INestApplication> {
  // Create a test module
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: modules,
  }).compile();

  // Create the app from the module
  const app = moduleFixture.createNestApplication();

  // Configure with global pipes/filters similar to main.ts
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) => {
        throw new BadRequestException('Validation failed', { cause: errors });
      },
    }),
  );
  app.useGlobalFilters(new GlobalErrorFilter());

  // Initialize the app
  await app.init();
  return app;
}

/**
 * Cleans the test database between tests
 * @param prismaService The PrismaService instance
 */
export const cleanDatabase = async (
  prismaService: PrismaService,
): Promise<void> => {
  // Order matters here due to foreign key constraints
  // Add more tables as needed
  const tables = [
    'notifications',
    'post_likes',
    'comment_likes',
    'comments',
    'bookmarks',
    'published_posts',
    'draft_posts',
    'user_activities',
    'user_emotions',
    'user_achievements',
    'user_streaks',
    'bot_interactions',
    'users',
  ];

  // Using Promise.all to execute truncate operations in parallel
  // rather than awaiting inside loop
  await Promise.all(
    tables.map(async (table) => {
      try {
        await prismaService.$executeRawUnsafe(
          `TRUNCATE TABLE "${table}" CASCADE;`,
        );
      } catch (e) {
        console.warn(`Could not truncate table ${table}: ${e.message}`);
      }
    }),
  );
};

/**
 * Properly tears down the test application and disconnects from the database
 * @param app The NestJS application instance
 * @param prismaService The PrismaService instance
 */
export const teardownTestApp = async (
  app?: INestApplication,
  prismaService?: PrismaService,
): Promise<void> => {
  try {
    // Disconnect from the database if prismaService exists
    if (prismaService) {
      await prismaService.$disconnect();
    }

    // Close the app if it exists
    if (app) {
      await app.close();
    }

    // Add a small delay to ensure all resources are released
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  } catch (error) {
    console.error('Error during test teardown:', error);
  }
};

/**
 * Sets up test data for a specific module
 * @param prismaService The PrismaService instance
 * @param module The module to seed data for
 */
export const seedTestData = async (
  prismaService: PrismaService,
  module: 'social' | 'user' | 'content' | 'feed',
): Promise<Record<string, any>> => {
  // This function will create test data specific to each module
  const testData: Record<string, any> = {};

  // Create base test user that will be used across all modules
  const testUser = await prismaService.user.create({
    data: {
      authId: '00000000-0000-4000-a000-000000000001',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      isActive: true,
      roles: ['USER'],
    },
  });
  testData.testUser = testUser;

  // Add module-specific test data
  switch (module) {
    case 'social': {
      // Add social-specific test data (likes, comments, etc.)
      break;
    }
    case 'user': {
      // Add user-specific test data (profiles, activities, etc.)
      break;
    }
    case 'content': {
      // Create test posts
      const testPost = await prismaService.publishedPost.create({
        data: {
          id: 'test-post-id',
          title: 'Test Post',
          content: 'This is a test post',
          // Use correct field for author relationship based on schema
          userAuthor: { connect: { id: testUser.id } },
          slug: 'test-post',
          excerpt: 'This is a test post',
        },
      });
      testData.testPost = testPost;
      break;
    }
    case 'feed': {
      // Add feed-specific test data
      break;
    }
    default: {
      // Handle unexpected module types
      break;
    }
  }

  return testData;
};
