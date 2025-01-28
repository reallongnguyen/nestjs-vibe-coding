import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Logger } from 'nestjs-pino';
import { Request } from 'express';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { AppError } from 'src/common/models/AppError';
import { AuthCtx } from '../../../core/domain/entities/auth-ctx.model';
import { AuthCtxRepoPort } from '../../../core/ports/auth-ctx-repo.port';

@Injectable()
export class JwtAuthCtxRepo implements AuthCtxRepoPort {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
  ) {}

  getAuthCtxId(request: Request): string {
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('auth: jwtGuard: missing access token');
      throw new AppError('common.invalidToken');
    }

    const signature = token.split('.')[2];

    if (!signature) {
      this.logger.warn('auth: jwtGuard: incorrect token format');
      throw new AppError('common.invalidToken');
    }

    const payload = this.jwtService.decode(token);

    if (!payload) {
      this.logger.warn('auth: jwtGuard: decode token got error');
      throw new AppError('common.invalidToken');
    }

    return `${payload.sub}:${signature}`;
  }

  async getAuthCtx(request: Request): Promise<AuthCtx> {
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('auth: jwtGuard: missing access token');
      throw new AppError('common.invalidToken');
    }

    const shouldVerifyToken = this.configService.get<boolean>(
      'security.shouldVerifyToken',
      false,
    );

    let payload: any;

    if (!shouldVerifyToken) {
      payload = this.jwtService.decode(token);

      if (!payload) {
        this.logger.warn('auth: jwtGuard: decode token got error');
        throw new AppError('common.invalidToken');
      }
    } else {
      payload = await this.jwtService
        .verifyAsync(token, {
          secret: this.configService.get<string>('security.jwtSecret'),
        })
        .catch((err) => {
          this.logger.warn(`auth: jwtGuard: invalid token: ${err.message}`);
          throw new AppError('common.invalidToken');
        });
    }

    const authCtx = AuthCtx.fromAuthServiceJwtPayload(payload);

    const user = await this.prismaService.user.findUnique({
      where: { authId: payload.sub },
    });

    if (user) {
      authCtx.setUser(user);
    }

    return authCtx;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
