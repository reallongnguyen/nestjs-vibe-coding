import { ApiProperty } from '@nestjs/swagger';

export class Pagination {
  @ApiProperty({
    type: 'number',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    type: 'number',
    example: 0,
  })
  offset: number;

  @ApiProperty({
    type: 'number',
    example: 100,
  })
  total: number;
}

export default class Collection<T> {
  @ApiProperty({
    description: 'List paginated data',
  })
  edges: T[];

  @ApiProperty({
    description: 'Pagination information',
  })
  pagination: Pagination;

  constructor(edges: T[], pagination: Pagination) {
    this.edges = edges;
    this.pagination = pagination;
  }

  static empty<T>(): Collection<T> {
    return new Collection<T>([], {
      limit: 0,
      offset: 0,
      total: 0,
    });
  }

  static transform<T, U>(
    collection: Collection<T>,
    transformer: (item: T) => U,
  ): Collection<U> {
    return new Collection(
      collection.edges.map(transformer),
      collection.pagination,
    );
  }
}
