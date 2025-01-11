# User Management Module

This module follows [Hexagonal Architecture](https://medium.com/ssense-tech/hexagonal-architecture-there-are-always-two-sides-to-every-story-bc0780ed7d9c) with Domain-Driven Design (DDD) principles.

![Hexagonal Architecture](https://miro.medium.com/v2/resize:fit:2000/format:webp/1*mGLO5IfhJv4o0NYOAZI60A.png)

## Directory Structure

```bash
user-management/
├── core/ # Domain + Application layers (inside the hexagon)
│ ├── domain/ # Domain layer
│ │ ├── entities/ # Domain entities/aggregates
│ │ │ └── user.entity.ts
│ │ ├── value-objects/
│ │ ├── events/
│ │ └── services/ # Domain services
│ │
│ ├── ports/ # Ports (interfaces) for incoming and outgoing adapters
│ │ ├── incoming/ # Primary/Driving ports (use cases)
│ │ │ └── user-management.port.ts
│ │ └── outgoing/ # Secondary/Driven ports (repositories, external services)
│ │   └── user.repository.port.ts
│ │
│ └── application/ # Application services implementing use cases
│   ├── dto/
│   └── services/
│     └── user.service.ts
│
├── adapter/ # Outside the hexagon
│ ├── presentation/ # Primary/Driving adapters
│ │ ├── rest/ # REST API controllers
│ │ │ └── user.controller.ts
│ │ └── graphql/ # GraphQL resolvers (if needed)
│ │
│ └── infrastructure/ # Secondary/Driven adapters
│   ├── persistence/ # Database implementations
│   │ └── user.repository.ts
│   └── external/ # External service adapters
│     └── notification/
│
└── user.module.ts # Module definition
```

## Layer Responsibilities

### Core (Inside the Hexagon)

#### Domain Layer

- Contains the core business logic
- Defines entities, value objects, and domain events
- Contains domain services for core business operations
- Pure business logic with no external dependencies

#### Ports

- Defines interfaces for all external communications
- Incoming ports define use cases (application API)
- Outgoing ports define required external services

#### Application Layer

- Implements use case logic
- Orchestrates domain objects
- Implements incoming ports
- Uses outgoing ports
- Handles transaction boundaries

### Adapters (Outside the Hexagon)

#### Incoming Adapters

- Implements REST controllers, GraphQL resolvers
- Handles HTTP/API concerns
- Converts external requests to internal commands/queries
- Input validation and error handling

#### Outgoing Adapters

- Implements repository interfaces
- Handles database operations
- External service integrations
- Infrastructure concerns

## Benefits of Hexagonal Architecture

1. **Better Isolation**
   - Core business logic is completely isolated from external concerns
   - Domain model is protected from infrastructure details
   - Easier to test business logic in isolation

2. **Flexibility**
   - Easy to swap implementations (e.g., change database, add new API)
   - Multiple adapters can coexist (e.g., REST and GraphQL)
   - Easier to add new features without touching existing code

3. **Clear Dependencies**
   - Dependencies flow inward
   - Core doesn't know about adapters
   - Clear separation between use cases and implementation

## Best Practices

1. Core should have no external dependencies
2. All external communication goes through ports
3. Adapters implement or use ports to communicate with core
4. Use dependency injection for adapter implementation
5. Keep domain logic pure and free of infrastructure concerns
6. Use DTOs for data transfer across boundaries
7. Implement proper validation at both domain and adapter levels

## Testing

- Core Layer: Pure unit tests
- Adapters: Integration tests
- End-to-End: Full system tests through primary adapters
