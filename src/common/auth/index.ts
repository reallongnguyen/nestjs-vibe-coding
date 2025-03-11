// Public interfaces
export { AuthCtx } from './core/domain/entities/auth-ctx.model';
export { Role } from './core/domain/entities/role.enum';
export { User } from './core/domain/entities/user.entity';

// Decorators
export {
  AuthContext,
  AuthContextUser,
  OptionalAuthContext,
} from './adapter/presentation/nestjs/decorators/auth-context.decorator';
export { RequireAnyRoles } from './adapter/presentation/nestjs/decorators/require-any-roles.decorator';

// Guards
export { AuthGuard } from './adapter/presentation/nestjs/auth.guard';
export { OptionalAuthGuard } from './adapter/presentation/nestjs/optional-auth.guard';
export { RolesGuard } from './adapter/presentation/nestjs/role.guard';
export { ApiKeyGuard } from './api-key.guard';
