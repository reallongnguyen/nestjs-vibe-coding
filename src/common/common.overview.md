# Common Module Overview

The Common Module provides core infrastructure and utilities used throughout the application.

## Key Components

### Authentication

- `AuthGuard`: Protects routes requiring authentication
- `OptionalAuthGuard`: Allows both authenticated and anonymous access
- `RolesGuard`: Enforces role-based access control
- `AuthContext`: Decorator to access authenticated user context
- `RequireAnyRoles`: Decorator to specify required roles for endpoints

### Configuration

- `AppConfigModule`: Centralizes application configuration
- `ConfigService`: Provides access to configuration values

### Database

- `PrismaModule`: Provides database access via Prisma ORM
- `PrismaService`: Service for database operations

### Event Bus

- `EventBusModule`: Provides event-driven communication
- `IEventBus`: Interface for publishing events
- `BaseEvent`: Base class for all events
- `InjectEventBus`: Decorator to inject the event bus

### Batch Processing

- `RedisBatchProcessor`: Handles batched operations with Redis

### Error Handling

- `AppError`: Standard error class for application errors

### Utilities

- `Retry`: Decorator for automatic retry logic
- `PagedResult`: Pagination wrapper for API responses
- `delay`: Utility for async delays

## Common Patterns

1. **Dependency Injection**: All services follow NestJS DI pattern
2. **Repository Pattern**: Data access through repository interfaces
3. **Event-Driven Communication**: Modules communicate via events
4. **Decorator-Based Authorization**: Auth checks via decorators
5. **Centralized Configuration**: Environment variables managed centrally
