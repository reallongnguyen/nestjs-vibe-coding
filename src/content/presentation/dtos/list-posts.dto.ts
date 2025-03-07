import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/presentation/dtos/pagination-query.dto';

export enum DraftPostSortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
}

export enum PublishedPostSortField {
  PUBLISHED_AT = 'publishedAt',
  UPDATED_AT = 'updatedAt',
  TITLE = 'title',
}

export class ListPostsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PublishedPostSortField })
  @IsEnum(PublishedPostSortField)
  @IsOptional()
  sortBy?: PublishedPostSortField = PublishedPostSortField.PUBLISHED_AT;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  topics?: string[];

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class ListDraftPostsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DraftPostSortField })
  @IsEnum(DraftPostSortField)
  @IsOptional()
  sortBy?: DraftPostSortField = DraftPostSortField.CREATED_AT;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',') : value,
  )
  topics?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  published?: boolean;
}
