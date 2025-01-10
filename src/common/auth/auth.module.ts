import { Global, Module } from '@nestjs/common';
import { LightConfigModule } from 'src/common/config/config.module';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthGuard } from './presentation/nestjs/auth.guard';
import { RolesGuard } from './presentation/nestjs/role.guard';
import { JWTGuard } from './presentation/nestjs/jwt.guard';
import { JwtAuthCtxRepo } from './infrastructure/repositories/jwt-auth-ctx.repo';

// TODO: implement loose coupling between the auth module and the PrismaService
@Global()
@Module({
  imports: [LightConfigModule, JwtModule],
  providers: [
    AuthGuard,
    ConfigService,
    JwtService,
    RolesGuard,
    JWTGuard,
    JwtAuthCtxRepo,
  ],
  exports: [AuthGuard, RolesGuard, JWTGuard],
})
export class AuthModule {}
