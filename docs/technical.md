# Technical Overview

This document outlines the technical architecture for an AI-based IDE built using NestJS, Prisma, and TypeScript. The system follows a modular microservices architecture with event-driven communication patterns.

## Technology Stack

- **Backend Framework**: NestJS
- **Language**: TypeScript
- **API docs**: Swagger
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT + role-based authorization
- **Event Bus**: EventBus module powered by NestJS EventEmitter
- **Caching**: Redis
- **Queue**: BullMQ
- **Real-time**: MQTT
- **Monitoring**: Prometheus, Grafana

## Core Modules

### 1. Common Module

```typescript
// src/common/common.module.ts
@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    CacheModule.registerAsync<RedisClientOptions>({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (service: ConfigService) => {
        return {
          stores: [new KeyvRedis(service.get<string>('redis.url'))],
        };
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        url: configService.get<string>('redis.url'),
      }),
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    HealthModule,
    PrismaModule,
  ],
})
export class CommonModule {}
```

### 2. Identity Module

```plaintext
// prisma/schema.prisma
model User {
  id              String            @id @default(uuid())
  authId          String            @unique @map("auth_id") @db.Uuid
  email           String?
  phone           String?
  firstName       String            @map("first_name") @db.Text
  lastName        String?           @map("last_name") @db.Text
  avatar          String?           @db.Text
  roles           UserRole[]
  isActive        Boolean           @default(true) @map("is_active")
  createdAt       DateTime          @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt       DateTime          @updatedAt @map("updated_at") @db.Timestamptz()
  userInSpaces    UserInSpaces[]
  activities      UserActivity[]
  publishedPosts  PublishedPost[]   @relation("UserAuthorPosts")
  draftPosts      DraftPost[]
  comments        Comment[]         @relation("UserAuthorComments")
  postLikes       PostLike[]
  commentLikes    CommentLike[]
  bookmarks       Bookmark[]
  feeds           Feed[]
  emotions        UserEmotion[]
  streak          UserStreak?
  achievements    UserAchievement[]
  botInteractions BotInteraction[]

  @@map("users")
}
```


### 3. Notification Module

```plaintext
// prisma/schema.prisma
model Notification {
  id               String    @id @default(uuid())
  key              String
  type             String
  userId           String    @map("user_id")
  /// [NotificationObjectType]
  subjects         Json[]
  subjectCount     Int       @map("subject_count")
  /// [NotificationObjectType]
  diObject         Json?     @map("di_object")
  /// [NotificationObjectType]
  inObject         Json?     @map("in_object")
  /// [NotificationObjectType]
  prObject         Json?     @map("pr_object")
  text             String
  /// [NotificationDecoratorType]
  decorators       Json[]
  link             String?
  notificationTime DateTime  @default(now()) @map("notification_time") @db.Timestamptz()
  viewedAt         DateTime? @map("viewed_at") @db.Timestamptz()
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt        DateTime  @updatedAt @map("updated_at") @db.Timestamptz()

  @@index([userId, notificationTime(sort: Desc)])
  @@index([userId, viewedAt])
  @@index([key], type: Hash)
  @@index([type], type: Hash)
  @@map("notifications")
}
```

### 4. Gamification Module

```plaintext
// prisma/schema.prisma
model UserEmotion {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  emotion   String
  intensity Int      @default(1) // Scale of 1-5 for emotion intensity
  note      String?  @db.Text // Optional note about the emotion
  date      DateTime @db.Date // Store just the date for daily tracking
  timestamp DateTime @default(now()) @db.Timestamptz() // Exact time of recording
  metadata  Json?    @default("{}") // Additional data for analytics
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([date])
  @@index([emotion])
  @@index([userId, date]) // For querying user's emotions by date
  @@map("user_emotions")
}
```

## Event-Driven Architecture

Prefer use event bus to communicate between modules. Use event bus instead of EventEmitter.

### Event Bus Configuration

```typescript
// src/common/event-bus/event-bus.module.ts
@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    {
      provide: EVENT_BUS_TOKEN,
      useClass: EventBusAdapter,
    },
  ],
  exports: [EVENT_BUS_TOKEN],
})
export class EventBusModule {}
```

### Publish event

```typescript
// src/identity/presentation/events/user-activity.handler.ts
@Injectable()
export class UserActivityHandler {
  constructor(
    @InjectEventBus()
    private readonly eventBus: IEventBus,
  ) {}
}
```

### Event Handlers

```typescript
// src/identity/presentation/events/user-activity.handler.ts
@Injectable()
export class UserActivityHandler {
  constructor(
    // AI-powered code
  ) {}

  @OnEvent(RoleChangeEvent.getEventName())
  async handleRoleChange(event: RoleChangeEvent) {
    // AI-powered code
  }
}
```

## Database Schema

### Prisma Schema

Read `prisma/schema.prisma`

## Security Implementations

### Authentication Guard

```typescript
// src/common/auth/adapter/presentation/nestjs/auth.guard.ts
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtGuard: JWTGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return this.jwtGuard.canActivate(context);
  }
}
```

### Authorization Guard

```typescript
// src/common/auth/adapter/presentation/nestjs/role.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { authCtx } = context.switchToHttp().getRequest();

    if (!authCtx) {
      throw new AppError('common.invalidToken');
    }

    if (!authCtx.isUser()) {
      throw new AppError('common.requireUser');
    }

    if (requiredRoles.find((role) => authCtx.getUser().roles.includes(role))) {
      return true;
    }

    throw new AppError('common.noPrivilege', {
      roles: requiredRoles.join(', '),
    });
  }
}
```

## Error handle

### App Error Definition

Define app error per module

```typescript
// src/identity/entities/user-error.map.ts
export const userErrorMap: ErrorMap = {
  ...commonErrorMap,
  user: {
    create: {},
    get: {
      notFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'User not found',
      },
    },
    profile: {
      get: {
        notFound: {
          status: HttpStatus.NOT_FOUND,
          message: 'User profile not found',
        },
      },
    },
    // AI-powered code
  },
};
```

### Define API docs

```typescript
// src/identity/presentation/rest/user.controller.ts
  @ErrorResponse('user.create', userErrorMap, { hasValidationErr: true })
  async create(
    @Body() userData: CreateUserDto,
    @AuthContext() authCtx: AuthCtx,
  ): Promise<UserDto> {
    // AI-powered code
  }
```

### Throw app error

```typescript
// src/identity/services/user.service.ts
throw new AppError('user.profile.get.notFound');
```

## Swagger document

Using @nestjs/swagger to create API docs for each API

### API definition

```typescript
// src/identity/presentation/rest/user.controller.ts
// 201 response
  @ApiOperation({ summary: 'Create user' })
  @CreatedResponse(UserDto)
  @ErrorResponse('user.create', userErrorMap, { hasValidationErr: true })

// 200 response
  @ApiOperation({
    summary: 'Bulk user operations (update/delete/deactivate/activate)',
  })
  @OkResponse(BulkOperationResultDto)
  @ErrorResponse('user.bulk', userErrorMap, { hasValidationErr: true })

// 200 response with pagination
  @ApiOperation({ summary: 'Get many users' })
  @PaginatedResponse(UserDto)
  @ErrorResponse('user.list', userErrorMap, { hasValidationErr: true })
```

### Model define

```typescript
// src/identity/presentation/rest/input/activity-filters.dto.ts
export class ActivityFiltersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offset?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}
```

## Deployment Architecture

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:22-alpine3.20 AS builder

ENV NODE_ENV build

USER node
WORKDIR /home/node

COPY package.json yarn.lock ./
RUN yarn install

COPY --chown=node:node . .

RUN npx prisma generate \
    && yarn build

# ---

FROM node:22-alpine3.20

ENV NODE_ENV production

USER node
WORKDIR /home/node

COPY --from=builder --chown=node:node /home/node/package.json /home/node/yarn.lock ./
COPY --from=builder --chown=node:node /home/node/node_modules/ ./node_modules/
COPY --from=builder --chown=node:node /home/node/dist/ ./dist/

CMD ["yarn", "start:prod"]
```

### Docker Compose Setup

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres
    restart: unless-stopped
    volumes:
      - pg-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - 5432:5432

  redis:
    image: redis/redis-stack
    restart: unless-stopped
    ports:
      - 6379:6379
    # environment:
    #   REDIS_ARGS: --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data

  mqtt01:
    image: emqx:latest
    restart: unless-stopped
    ports:
      - 18083:18083
      - 1883:1883
      - 8883:8883
      - 8083:8083
      - 8084:8084
    volumes:
      - vol-emqx01-data:/opt/emqx/data
      - vol-emqx01-log:/opt/emqx/log
    environment:
      - 'EMQX_NODE__NAME=emqx@node01.emqx.io'
      - 'EMQX_CLUSTER__DISCOVERY_STRATEGY=static'
      - 'EMQX_CLUSTER__STATIC__SEEDS=[emqx@node01.emqx.io, emqx@node02.emqx.io]'
    networks:
      vpc-bridge:
        aliases:
          - node01.emqx.io

  mqtt02:
    image: emqx:latest
    restart: unless-stopped
    ports:
      - 28083:18083
      - 2883:1883
      - 9883:8883
      - 9083:8083
      - 9084:8084
    volumes:
      - vol-emqx02-data:/opt/emqx/data
      - vol-emqx02-log:/opt/emqx/log
    environment:
      - 'EMQX_NODE__NAME=emqx@node02.emqx.io'
      - 'EMQX_CLUSTER__DISCOVERY_STRATEGY=static'
      - 'EMQX_CLUSTER__STATIC__SEEDS=[emqx@node01.emqx.io, emqx@node02.emqx.io]'
    networks:
      vpc-bridge:
        aliases:
          - node02.emqx.io

volumes:
  pg-data:
  redis-data:
  vol-emqx01-data:
  vol-emqx01-log:
  vol-emqx02-data:
  vol-emqx02-log:

networks:
  vpc-bridge:
    driver: bridge
```

## Scaling Considerations

1. **Horizontal Scaling**

   - Use Kubernetes for container orchestration
   - Implement load balancing at the API Gateway level
   - Scale individual microservices independently

2. **Performance Optimization**

   - Implement caching strategies using Redis
   - Optimize database queries and indexes
   - Use MQTT for real-time features

3. **Monitoring and Logging**
   - Implement ELK stack for centralized logging
   - Use Prometheus and Grafana for metrics
   - Set up application performance monitoring

## Development Workflow

1. **Local Development**

   ```bash
   # Start development environment
   yarn run start:dev

   # Run database migrations
   npx prisma db push
   export ROOT_USER_AUTH_ID=86f41bd0-a011-45a2-837d-36ff38f6e8da
   npx prisma db seed

   # Generate new migration
   npx prisma migrate dev --name <migration_name>
   ```

2. **Testing Strategy**

   TBD

## Future Considerations

1. **Production ready**

   - OpenAPI documentation

2. **Extensibility**

   - Microservices-ready architecture
   - Portable Module
   - API versioning strategy

3. **Developer Experience**
   - Interactive documentation
   - Developer portal
   - API playground
