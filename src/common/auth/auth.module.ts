import { Global, Module } from '@nestjs/common';
import { LightConfigModule } from 'src/common/config/config.module';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthGuard } from './user-interface/nestjs/auth.guard';
import { RolesGuard } from './user-interface/nestjs/role.guard';
import { JWTGuard } from './user-interface/nestjs/jwt.guard';

// TODO: implement loose coupling between the auth module and the PrismaService
@Global()
@Module({
  imports: [LightConfigModule, JwtModule],
  providers: [AuthGuard, ConfigService, JwtService, RolesGuard, JWTGuard],
  exports: [AuthGuard, RolesGuard, JWTGuard],
})
export class AuthModule {}
