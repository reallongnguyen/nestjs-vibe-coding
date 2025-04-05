# NestJS Vibe Coding Template

[![NestJS](https://img.shields.io/badge/NestJS-11.0.11-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.2.1-2D3748.svg)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/reallongnguyen/base-api-service/blob/main/CONTRIBUTING.md)

A robust and flexible NestJS backend template designed for microservice-ready architecture with modular components that can be easily customized and deployed.

## 🚀 Quick Start

### Setup

```bash
# Clone and install
git clone https://github.com/reallongnguyen/nestjs-vibe-coding
cd nestjs-vibe-coding
pnpm install

# Configure environment
cp .env.example .env

# Start dependencies (PostgreSQL, Redis, MQTT)
docker compose up -d

# Setup database
npx prisma db push

# Create Root user
export ROOT_USER_AUTH_ID=86f41bd0-a011-45a2-837d-36ff38f6e8da
npx prisma db seed
```

### Development

```bash
# Start dev server with hot reload
pnpm start:dev

# Start production server
pnpm build
pnpm start:prod
```

## ✨ Features

- **Microservice Architecture**: Designed with modularity in mind, ready to split into separate microservices
- **Prisma ORM**: Type-safe database client for PostgreSQL integration
- **JWT Authentication**: Secure authentication & role-based authorization
- **Event-Driven**: Event system for asynchronous communication between modules
- **OpenAPI Documentation**: Automatic API documentation generation
- **Container Ready**: Docker and Kubernetes compatible

## 📦 Module Structure

| Module | Features | Status | Dependencies |
|--------|----------|--------|--------------|
| **Common** | Core utilities, error handling, logger | Beta | PostgreSQL |
| **Identity** | User management, authentication | Alpha | PostgreSQL, Gotrue |
| **Content** | Posts, stories, tweets | Alpha | PostgreSQL |
| **Social** | Comments, likes, follows | Alpha | PostgreSQL |
| **Notification** | User notifications | Alpha | PostgreSQL, Redis, MQTT |
| **Feed** | User activity feeds | Alpha | PostgreSQL, Redis |
| **Storage** | File uploads and management | Alpha | Google Cloud Storage |
| **Gamification** | Points, badges, rewards | Alpha | PostgreSQL |
| **User-Follow** | User follow relationships | Beta | PostgreSQL |
| **Invitation** | User invitations | Beta | PostgreSQL |
| **Recommendation** | Content recommendations | Alpha | PostgreSQL, Redis, Gorse |
| **Search** | Search functionality | - | PostgreSQL |
| **Payment** | Payment processing | - | PostgreSQL |
| **AI** | AI integrations | - | Planned |
| **Analytic** | Data analytics | Planned | PostgreSQL |

## 🧩 Vibe Coding with Cursor

This project is optimized for development with [Cursor](https://cursor.so/), an AI-powered code editor that enhances your coding experience.

### Getting Started with Cursor

1. **Install Cursor**: Download from [https://cursor.so/](https://cursor.so/)
2. **Open this Project**: Use File > Open to navigate to the project
3. **Use AI Commands**: Press `Ctrl+K` or `Cmd+K` to open the AI command palette

Cursor helps you understand the codebase faster and implement features more efficiently by providing context-aware AI assistance.

## 🔧 Customizing Your Project

### Removing Unused Modules

The template is designed to be modular, making it easy to remove unnecessary components:

1. Remove the module directory from `src/`
2. Remove the module import from `src/app.module.ts`
3. Remove related database schema from `prisma/schema.prisma` (if applicable)

Example:

```typescript
// src/app.module.ts
@Module({
  imports: [
    CommonModule,
    IdentityModule,
    // Remove the line below to remove the ContentModule
    // ContentModule,
    SocialModule,
    // ...other modules
  ],
  controllers: [AppController],
})
export class AppModule {}
```

## 📚 Infrastructure and Deployment

This template uses Docker and docker-compose for local development. For production deployment, we recommend:

- **Kubernetes**: For orchestrating the microservices
- **Cloud Providers**: AWS, GCP, or Azure for managed infrastructure

See the [deployment documentation](infra/docker/README.md) for detailed instructions on deploying to different environments.

## 🤝 Contributing

Contributions are welcome! Whether it's:

- 🐛 Reporting a bug
- 💡 Requesting a feature
- 📝 Improving documentation
- 🧑‍💻 Submitting a PR

Please check out our [Contribution Guidelines](./CONTRIBUTING.md) before making a contribution.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Nguyen Phuc Long
