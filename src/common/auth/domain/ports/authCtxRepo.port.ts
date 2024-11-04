import { AuthContextInfo } from '../models/auth-context-info.model';

export interface AuthCtxRepo {
  getAuthCtxId: (request: any) => string;
  getAuthCtx: (request: any) => Promise<AuthContextInfo>;
}
