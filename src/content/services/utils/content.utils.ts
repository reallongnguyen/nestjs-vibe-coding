import slugify from 'slugify';

export function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });
}

function extractTextFromBlocks(blocks: any[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'paragraph' || block.type === 'header') {
        return block.text || '';
      }
      return '';
    })
    .join(' ');
}

export function calculateReadingTime(content: Record<string, any>): number {
  // Extract text from content blocks
  const text = extractTextFromBlocks(content.blocks || []);

  // Calculate words (rough estimate)
  const words = text.split(/\s+/).length;

  // Average reading speed: 200 words per minute
  const minutes = Math.ceil(words / 200);

  return Math.max(1, minutes); // Minimum 1 minute
}

export function generateExcerpt(content: Record<string, any>): string {
  const text = extractTextFromBlocks(content.blocks || []);

  return `${text.slice(0, 157).trim()}...`;
}
