import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../src/common/prisma/prisma.service';

@Injectable()
export class TestDataGenerator {
  constructor(private readonly prisma: PrismaService) {}

  async createTestData() {
    const user = await this.prisma.user.create({
      data: {
        authId: '00000000-0000-0000-0000-000000000000',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        roles: ['USER'],
      },
    });

    const content = await this.prisma.publishedPost.create({
      data: {
        title: 'Test Post',
        slug: 'test-post',
        content: { blocks: [] },
        excerpt: 'Test excerpt',
        readingTime: 1,
        userId: user.id,
        publishedAt: new Date(),
      },
    });

    return { user, content };
  }

  async createBulkTestData(count: number) {
    const baseData = await this.createTestData();

    return Array.from({ length: count }, () => ({
      userId: baseData.user.id,
      type: 'LIKE',
      content: baseData.content,
    }));
  }

  async generateMultipleActions(config: {
    count: number;
    type: string;
    targetContent: any;
  }) {
    const userPromises = Array.from({ length: config.count }, (_, index) =>
      this.prisma.user.create({
        data: {
          authId: `test-${index}`,
          firstName: `Test ${index}`,
          lastName: 'User',
          email: `test${index}@example.com`,
          roles: ['USER'],
        },
      }),
    );

    const users = await Promise.all(userPromises);

    return users.map((user) => ({
      userId: user.id,
      type: config.type,
      content: config.targetContent,
    }));
  }
}
