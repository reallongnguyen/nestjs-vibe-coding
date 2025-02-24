import { PrismaService } from '../prisma/prisma.service';

export class DatabaseHelper {
  constructor(private readonly prisma: PrismaService) {}

  async cleanDatabase() {
    // Delete in correct order to avoid foreign key constraints
    await this.prisma.$transaction([
      this.prisma.draftPost.deleteMany(),
      this.prisma.topic.deleteMany(),
    ]);
  }

  async createTestTopic(data: { id: string; name: string; slug: string }) {
    return this.prisma.topic.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: null,
      },
    });
  }

  async resetTable(tableName: string) {
    // Recreate table using schema
    await this.prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "${tableName}" CASCADE`,
    );
  }
}
