export const TEST_TOPIC = {
  id: 'test-topic-1',
  name: 'Test Topic',
  description: 'A test topic',
  slug: 'test-topic-1',
};

export const TEST_DRAFT_POST = {
  title: 'Test Draft Post',
  subtitle: 'Test Subtitle',
  content: {
    blocks: [
      {
        type: 'paragraph',
        text: 'This is a test draft post content. It needs to be long enough to generate a meaningful excerpt and reading time calculation. So we are adding more text here to make it more realistic. This should be enough for testing purposes.',
      },
      {
        type: 'header',
        text: 'Test Header',
      },
    ],
  },
  cover: 'https://example.com/test-image.jpg',
  topics: [TEST_TOPIC.id],
};

export const EXPECTED_PUBLISHED_POST = {
  id: expect.any(String),
  title: TEST_DRAFT_POST.title,
  subtitle: TEST_DRAFT_POST.subtitle,
  content: TEST_DRAFT_POST.content,
  cover: TEST_DRAFT_POST.cover,
  topics: TEST_DRAFT_POST.topics,
  slug: expect.stringContaining(TEST_DRAFT_POST.title.toLowerCase()),
  excerpt: expect.stringContaining('This is a test draft post content'),
  readingTime: expect.any(Number),
  userId: expect.any(String),
  publishedAt: expect.any(String),
  updatedAt: expect.any(String),
};
