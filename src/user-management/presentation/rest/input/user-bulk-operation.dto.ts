import { IsArray, IsEnum, IsString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { Role } from '../../../domain/entities/role.enum';

export enum BulkOperationType {
  UPDATE_ROLE = 'UPDATE_ROLE',
  DEACTIVATE = 'DEACTIVATE',
  DELETE = 'DELETE',
}

export class BulkUserOperationDto {
  @ApiProperty({ enum: BulkOperationType })
  @IsEnum(BulkOperationType)
  operation: BulkOperationType;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({ enum: Role, required: false })
  @ValidateIf((o) => o.operation === BulkOperationType.UPDATE_ROLE)
  @IsEnum(Role)
  newRole?: Role;
}
