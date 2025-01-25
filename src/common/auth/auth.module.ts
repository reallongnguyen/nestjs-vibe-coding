import { Global, Module } from '@nestjs/common';
import { LightConfigModule } from 'src/common/config/config.module';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthGuard } from './adapter/presentation/nestjs/auth.guard';
import { RolesGuard } from './adapter/presentation/nestjs/role.guard';
import { JWTGuard } from './adapter/presentation/nestjs/jwt.guard';
import { JwtAuthCtxRepo } from './adapter/infrastructure/repositories/jwt-auth-ctx.repo';
import { AuthService } from './core/application/services/auth.service';

// TODO: implement loose coupling between the auth module and the PrismaService
@Global()
@Module({
  imports: [LightConfigModule, JwtModule],
  providers: [
    AuthGuard,
    ConfigService,
    JwtService,
    AuthService,
    RolesGuard,
    JWTGuard,
    JwtAuthCtxRepo,
  ],
  exports: [AuthGuard, RolesGuard, JWTGuard],
})
export class AuthModule {}
