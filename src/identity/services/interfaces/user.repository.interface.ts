import { PagedResult } from 'src/common/models';

import { UserSearchFiltersDto } from '../../presentation/dtos/user-search-filters.input';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.enum';

export interface FindUniqueUserParams {
  where: {
    id?: string;
    authId?: string;
  };
}

export interface UpdateUserParams {
  where: {
    id?: string;
    authId?: string;
  };
  data: Partial<Pick<User, 'firstName' | 'lastName' | 'avatar' | 'roles'>>;
}

export interface UpsertUserParams {
  where: {
    authId: string;
  };
  create: Pick<User, 'authId' | 'firstName' | 'roles'> & {
    avatar?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  update: Partial<Pick<User, 'firstName' | 'lastName' | 'avatar'>>;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findUnique(params: FindUniqueUserParams): Promise<User | null>;
  findMany(filters: UserSearchFiltersDto): Promise<PagedResult<User>>;
  count(): Promise<number>;
  upsert(params: UpsertUserParams): Promise<User>;
  update(params: UpdateUserParams): Promise<User>;
  search(filters: UserSearchFiltersDto): Promise<PagedResult<User>>;
  updateRole(userId: string, role: Role[]): Promise<User>;
  deactivate(userId: string): Promise<User>;
  activate(userId: string): Promise<User>;
  delete(userId: string): Promise<void>;
  createPasswordReset(
    userId: string,
  ): Promise<{ token: string; expiresAt: Date }>;
}
