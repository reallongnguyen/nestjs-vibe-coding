export class ListUserInput {
  name?: string;
  offset?: number;
  limit?: number;
  orderBy?: 'name';
  orderDirection?: 'asc' | 'desc';
}

export class UpsertUserInput {
  authId: string;
  name: string;
  avatar?: string;
}
