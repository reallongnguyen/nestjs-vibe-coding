import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JWTGuard } from './jwt.guard';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtGuard: JWTGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.jwtGuard.canActivate(context);
  }
}
