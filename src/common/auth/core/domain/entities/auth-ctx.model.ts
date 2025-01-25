import { isNotEmpty } from 'class-validator';

import { User } from './user.entity';

export enum AgentType {
  person = 'person',
  service = 'service',
}

export interface Person {
  authId: string;
  email?: string;
  phone?: string;
}

export interface Service {
  id: string;
}

export class AuthCtx {
  private agentType: AgentType;
  private expireAt?: number;

  private person?: Person;
  private service?: Service;

  private user?: User;

  static fromAuthServiceJwtPayload(obj: any): AuthCtx {
    const authCtx = new AuthCtx();

    authCtx.person = {
      authId: obj.sub,
      email: isNotEmpty(obj.email) ? obj.email : undefined,
      phone: isNotEmpty(obj.phone) ? obj.phone : undefined,
    };

    authCtx.agentType = AgentType.person;
    authCtx.expireAt = obj.exp;

    return authCtx;
  }

  static fromJSObject(obj: any): AuthCtx {
    const authCtx = new AuthCtx();

    authCtx.agentType = obj.agentType;
    authCtx.expireAt = obj.expireAt;

    if (obj.person) {
      authCtx.person = obj.person;
    }

    if (obj.service) {
      authCtx.service = obj.service;
    }

    if (obj.user) {
      authCtx.user = obj.user;
    }

    return authCtx;
  }

  isPerson(): boolean {
    return !!this.person;
  }

  isService(): boolean {
    return !!this.service;
  }

  isUser(): boolean {
    return !!this.user;
  }

  setUser(user: User) {
    this.user = user;
  }

  getExpireAt(): number | undefined {
    return this.expireAt;
  }

  getPerson(): Person | undefined {
    return this.person;
  }

  getUser(): User | undefined {
    return this.user;
  }
}

export function shouldCache(authCtx: AuthCtx): boolean {
  if (authCtx.isService()) {
    return true;
  }

  return authCtx.isPerson() && authCtx.isUser();
}
