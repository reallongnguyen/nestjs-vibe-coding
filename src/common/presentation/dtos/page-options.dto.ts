import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * DTO for handling page-based list operations
 * @example
 * {
 *   pageNumber: 0,
 *   pageSize: 10
 * }
 */
export class PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Page number (0-based). Default is 0.',
    example: 0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Page number must be greater than or equal to 0' })
  @Transform(({ value }) => parseInt(value, 10))
  pageNumber?: number = 0;

  @ApiPropertyOptional({
    description: 'Number of items per page. Default is 10, maximum is 100.',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'Page size must be greater than 0' })
  @Max(100, { message: 'Page size cannot exceed 100 items' })
  @Transform(({ value }) => parseInt(value, 10))
  pageSize?: number = 10;

  constructor(pageNumber?: number, pageSize?: number) {
    this.pageNumber = pageNumber ?? 0;
    this.pageSize = pageSize ?? 10;
  }

  /**
   * Converts the page options to database query parameters
   * @returns Object with skip and take properties for database query
   */
  toDatabaseQuery() {
    return {
      skip: this.pageNumber * this.pageSize,
      take: this.pageSize,
    };
  }

  /**
   * Creates pagination metadata for the response
   * @param totalItems - Total number of items available
   * @returns PaginationInfo object
   */
  toResponseMeta(totalItems: number) {
    const totalPages = Math.ceil(totalItems / this.pageSize);

    return {
      pageSize: this.pageSize,
      pageNumber: this.pageNumber,
      totalItems,
      totalPages,
      hasNextPage: this.pageNumber < totalPages - 1,
      hasPreviousPage: this.pageNumber > 0,
    };
  }
}
