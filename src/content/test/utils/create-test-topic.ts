import { PrismaService } from 'src/common/prisma/prisma.service';

export async function createTestTopic(prisma: PrismaService) {
  return prisma.topic.create({
    data: {
      name: `Test Topic ${Date.now()}`,
      slug: `test-topic-${Date.now()}`,
      description: 'Test topic description',
    },
  });
}
