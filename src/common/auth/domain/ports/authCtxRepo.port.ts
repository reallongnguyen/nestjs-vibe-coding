import { Request } from 'express';
import { AuthContextInfo } from '../models/auth-context-info.model';

export interface AuthCtxRepo {
  getAuthCtxId(request: Request): string;
  getAuthCtx(request: Request): Promise<AuthContextInfo>;
}
