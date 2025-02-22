# Module Directory Structure Principles

## Overview

This application follows a simplified Domain-Driven Design (DDD) inspired architecture, organized by business domains. Each module follows a consistent structure to maintain code organization and separation of concerns.

## Base Module Structure

```plaintext
src/
└── {module-name}/
    ├── entities/               # Domain models and types
    │   └── events/             # Domain events
    │
    ├── repositories/           # Data access layer
    │   ├── mappers/            # Data mapping logic
    │   └── models/             # Database models
    │
    ├── services/               # Business logic
    │   ├── interfaces/         # Repository interfaces
    │   └── dtos/               # Service-layer DTOs
    │
    ├── presentation/           # Controllers and DTOs
    │   ├── controllers/        # HTTP controllers
    │   ├── handlers/           # Event handlers
    │   ├── middlewares/        # HTTP middlewares
    │   ├── decorators/         # Custom decorators
    │   ├── guards/             # Authentication/Authorization guards
    │   └── dtos/               # Request/Response DTOs
    │
    └── {module-name}.module.ts # Module definition
```

## Directory Responsibilities

### 1. entities/

- Domain models that represent business objects
- Type definitions and enums specific to the domain
- Business rules and validation logic

```typescript
export class User {
  id: string;
  email: string;
  // ... other properties
}
```

### 2. repositories/

- Repository implementations using Prisma
- Query and persistence logic

```typescript
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}
  // ... implementation
}
```

### 3. services/

- Business logic implementation
- Data access interfaces
- Orchestration of repositories
- Domain event handling

```typescript
// src/identity/services/interfaces/user.repository.interface.ts
export interface IUserRepository {
  findById(id: string): Promise<User>;
  create(data: CreateUserDto): Promise<User>;
}

// src/identity/services/user.service.ts
@Injectable()
export class UserService {
  constructor(
    private userRepository: IUserRepository,
    private eventBus: EventBusPort
  ) {}
  // ... business methods
}
```

### 4. presentation/

- HTTP controllers
- Request/Response DTOs
- Input validation
- Output formatters

```typescript
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
  // ... route handlers
}
```

### 5. module.ts

- Module definition
- Dependency injection setup
- Provider and controller registration

```typescript
@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository
  ],
  exports: [UserService]
})
export class UserModule {}
```

## Best Practices

1. **Dependency Injection**
   - Always define interfaces for repositories
   - Inject dependencies through constructors
   - Use dependency injection tokens when needed

2. **Separation of Concerns**
   - Keep controllers thin
   - Business logic belongs in services
   - Data access only through repositories

3. **Domain Isolation**
   - Modules should be self-contained
   - Cross-module communication through services
   - Shared code goes in common module

4. **Type Safety**
   - Use DTOs for data transfer
   - Define clear interfaces
   - Leverage TypeScript features

5. **Error Handling**
   - Domain-specific error types
   - Consistent error mapping
   - Proper error propagation

## Example Module Structure

```plaintext
src/content/
├── entities/
│   ├── post.entity.ts
│   ├── comment.entity.ts
│   └── topic.entity.ts
├── repositories/
│   ├── post.repository.ts
│   └── comment.repository.ts
├── services/
│   ├── interfaces/
│   │   ├── post.repository.interface.ts
│   │   └── comment.repository.interface.ts
│   └── content.service.ts
├── presentation/
│   ├── content.controller.ts
│   └── dtos/
│       ├── create-post.dto.ts
│       └── post-response.dto.ts
└── content.module.ts
```

This structure provides:

- Clear organization of code
- Easy to understand responsibilities
- Maintainable and testable components
- Scalable architecture
- Consistent patterns across modules
