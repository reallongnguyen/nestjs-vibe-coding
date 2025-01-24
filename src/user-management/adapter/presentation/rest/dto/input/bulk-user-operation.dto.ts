import { Role } from 'src/user-management/core/domain/entities/role.enum';

export enum BulkOperationType {
  UPDATE_ROLE = 'UPDATE_ROLE',
  DEACTIVATE = 'DEACTIVATE',
  DELETE = 'DELETE',
}

export class BulkUserOperationDto {
  userIds: string[];
  operation: BulkOperationType;
  newRole?: Role;
}
