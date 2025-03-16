export interface CreateDraftPostData {
  title: string;
  subtitle?: string | null;
  content: Record<string, any>;
  cover?: string | null;
  topics: string[];
  userId: string;
  publishedId?: string | null;
}
