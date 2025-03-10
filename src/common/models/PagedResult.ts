import { ApiProperty } from '@nestjs/swagger';

export class PageMeta {
  @ApiProperty({
    type: 'number',
    example: 20,
    description: 'Number of items to return per page',
  })
  pageSize: number;

  @ApiProperty({
    type: 'number',
    example: 0,
    description: 'Current page number (0-based)',
  })
  pageNumber: number;

  @ApiProperty({
    type: 'number',
    example: 100,
    description: 'Total number of items available',
  })
  totalItems: number;

  @ApiProperty({
    type: 'number',
    example: 5,
    description: 'Total number of pages available',
  })
  totalPages: number;

  @ApiProperty({
    type: 'boolean',
    example: true,
    description: 'Whether there is a next page available',
  })
  hasNextPage: boolean;

  @ApiProperty({
    type: 'boolean',
    example: false,
    description: 'Whether there is a previous page available',
  })
  hasPreviousPage: boolean;
}

export class PagedResult<T> {
  @ApiProperty({
    description: 'List of items in the current page',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PageMeta,
  })
  meta: PageMeta;

  constructor(data: T[], meta: PageMeta) {
    this.data = data;
    this.meta = meta;
  }

  static empty<T>(): PagedResult<T> {
    return new PagedResult<T>([], {
      pageSize: 0,
      pageNumber: 0,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  }

  static transform<T, U>(
    pagedResult: PagedResult<T>,
    transformer: (item: T) => U,
  ): PagedResult<U> {
    return new PagedResult(pagedResult.data.map(transformer), pagedResult.meta);
  }
}
