import { PrismaService } from 'src/common/prisma/prisma.service';
import { DraftPost } from '../../entities/draft-post.entity';

interface CreateTestDraftPostOptions {
  userId: string;
  title?: string;
  subtitle?: string;
  content?: Record<string, any>;
  topics?: string[];
  cover?: string;
  publishedId?: string;
}

export async function createTestDraftPost(
  prisma: PrismaService,
  options: CreateTestDraftPostOptions,
): Promise<DraftPost> {
  return (await prisma.draftPost.create({
    data: {
      title: options.title || 'Test Draft Post',
      subtitle: options.subtitle,
      content: options.content || { text: 'Test content' },
      topics: options.topics || [],
      cover: options.cover,
      userId: options.userId,
      publishedId: options.publishedId,
    },
  })) as DraftPost;
}
