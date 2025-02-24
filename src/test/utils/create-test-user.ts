import { PrismaService } from '../../common/prisma/prisma.service';

export interface TestUser {
  id: string;
  token: string;
}

export async function createTestUser(prisma: PrismaService): Promise<TestUser> {
  const user = await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      firstName: `Test User ${Date.now()}`,
      authId: `auth-${Date.now()}`,
    },
  });

  return {
    id: user.id,
    token: 'test-token', // Mock token for testing
  };
}
