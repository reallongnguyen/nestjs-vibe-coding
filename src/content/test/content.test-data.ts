export const TEST_TOPIC = {
  id: 'test-topic-1',
  name: 'Test Topic',
  slug: 'test-topic',
  description: null,
} as const;

export const TEST_DRAFT_POST = {
  title: 'Test Post',
  subtitle: 'Test Subtitle',
  content: { blocks: [{ type: 'paragraph', text: 'Test content' }] },
  cover: 'https://example.com/image.jpg',
  topics: [TEST_TOPIC.id],
} as const;
