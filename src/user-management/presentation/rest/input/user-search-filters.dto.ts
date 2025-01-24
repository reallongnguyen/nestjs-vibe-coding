import {
  IsOptional,
  IsString,
  IsEnum,
  IsDate,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from 'src/common/auth';

export class UserSearchFiltersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive' | 'deleted';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  createdAfter?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  createdBefore?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offset?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}
