# Module Directory Structure - Simplified Version

## Overview

This is a simplified version of the module structure, optimized for rapid MVP development while maintaining clean code organization.

## Simplified Module Structure

```plaintext
src/
└── {module-name}/
    ├── entities/         # Domain models
    ├── services/         # Business logic + data access
    ├── presentation/     # Controllers and DTOs
    └── {module-name}.module.ts
```

## Directory Responsibilities

### 1. entities/

- Domain models representing business objects
- Type definitions and enums

```typescript
export class User {
  id: string;
  email: string;
  name: string;
}
```

### 2. services/

- Business logic implementation
- Direct Prisma service usage
- Data access operations

```typescript
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  
  async findById(id: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { id } });
  }
  
  async create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
```

### 3. presentation/

- Controllers
- Request/Response DTOs

```typescript
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
  
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
```

### 4. module.ts

- Module definition and DI setup

```typescript
@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
```

## Example Module Structure

```plaintext
src/content/
├── entities/
│   ├── post.entity.ts
│   └── comment.entity.ts
├── services/
│   └── content.service.ts
├── presentation/
│   ├── content.controller.ts
│   └── dtos/
│       ├── create-post.dto.ts
│       └── post-response.dto.ts
└── content.module.ts
```

## Key Differences from Full Architecture

1. **Repository Layer Removed**
   - Services directly use PrismaService
   - Eliminates repository interfaces and implementations
   - DTOs can be shared between presentation and service layers

2. **Simplified Dependencies**
   - Fewer files to maintain
   - Faster development cycle
   - Easier to refactor later if needed

3. **Migration Path**
   - Can be evolved into full architecture when needed
   - Repository layer can be added gradually
   - Maintains basic separation of concerns

## Best Practices for MVP

1. **Keep It Simple**
   - Use DTOs for both input and output
   - Minimal abstractions
   - Direct database access through Prisma

2. **Maintainable Code**
   - Clear service methods
   - Proper error handling
   - Basic input validation

3. **Future-Proofing**
   - Document technical debt
   - Keep modules isolated
   - Follow naming conventions
