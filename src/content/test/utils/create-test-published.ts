import { PrismaService } from 'src/common/prisma/prisma.service';
import { PublishedPost } from '../../entities/published-post.entity';

interface CreateTestPublishedPostOptions {
  userId: string;
  title?: string;
  subtitle?: string;
  content?: Record<string, any>;
  excerpt?: string;
  slug?: string;
  cover?: string;
  publishedAt?: Date;
  topics?: string[];
}

export async function createTestPublishedPost(
  prisma: PrismaService,
  options: CreateTestPublishedPostOptions,
): Promise<PublishedPost> {
  const title = options.title || 'Test Published Post';
  const post = await prisma.publishedPost.create({
    data: {
      title,
      subtitle: options.subtitle,
      content: options.content || { text: 'Test content' },
      excerpt: options.excerpt || 'Test excerpt',
      slug: options.slug || `test-published-${Date.now()}`,
      cover: options.cover,
      userId: options.userId,
      publishedAt: options.publishedAt || new Date(),
      readingTime: 5,
      viewCount: 0,
      likeCount: 0,
      replyCount: 0,
    },
  });

  if (options.topics?.length) {
    await prisma.postTopic.createMany({
      data: options.topics.map((topicId) => ({
        postId: post.id,
        topicId,
      })),
    });
  }

  return {
    ...post,
    topics: options.topics || [],
  } as PublishedPost;
}
