export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
