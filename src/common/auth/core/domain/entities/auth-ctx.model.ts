import { cloneDeep, merge } from 'lodash';
import { Role } from './role.enum';

export enum AgentType {
  person = 'person',
  service = 'service',
}

export interface Person {
  authId: string;
  userId?: string;
}

export interface Service {
  id: string;
}

export class AuthCtx {
  agentType: AgentType;
  roles: Role[];
  expireAt?: number;

  person?: Person;
  service?: Service;

  static fromAuthServiceJwtPayload(obj: any): AuthCtx {
    const authCtx = new AuthCtx();

    authCtx.person = { authId: obj.sub };
    authCtx.agentType = AgentType.person;
    authCtx.roles = obj.roles || [];
    authCtx.expireAt = obj.exp;

    return authCtx;
  }
}

export function shouldCache(authCtx: AuthCtx): boolean {
  if (authCtx.agentType === AgentType.service) {
    return true;
  }

  return (
    authCtx.agentType === AgentType.person &&
    authCtx.person?.userId !== undefined
  );
}

export function setUser(
  authCtx: AuthCtx,
  user: { id: string; roles: Role[] },
): AuthCtx {
  const newAuthCtx = cloneDeep(authCtx);

  newAuthCtx.roles = [...newAuthCtx.roles, ...user.roles];
  newAuthCtx.person = merge(newAuthCtx.person, { userId: user.id });

  return newAuthCtx;
}
