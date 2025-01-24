# API Service

Backend API service providing CRUD operations with Prisma ORM integration.

## Features

- Prisma ORM for data management
- JWT authentication & role-based authorization
- Custom error handling
- OpenAPI documentation
- ESLint integration
- Microservices-ready architecture

## Quick Start

### Setup

```bash
# Clone and install
git clone https://github.com/reallongnguyen/base-api-service.git
cd base-api-service
yarn install

# Configure environment
cp .env.example .env

# Start dependencies (PostgreSQL, Redis, MQTT)
docker compose up -d

# Setup database
npx prisma db push

# Create Root user
export ROOT_USER_AUTH_ID=<user_id_in_auth_service>
npx prisma db seed
```

### Development

```bash
# Start dev server with hot reload
yarn start:dev

# Start production server
yarn build
yarn start:prod
```

### Testing

- API docs: `http://localhost:8000/api`
- Health check:

```bash
curl 'localhost:8000/health' -H 'Authorization: Bearer <YOUR_JWT>'
```

#### JWT Generation

For testing purposes, you can generate a valid JWT using:

```bash
# Using node
node -e "require('dotenv').config(); console.log(require('jsonwebtoken').sign({ sub: '86f41bd0-a011-45a2-837d-36ff38f6e8da' }, process.env.JWT_SECRET, { expiresIn: '1h' }))"
```

### Database Management

```bash
# Update database schema
npx prisma db push

# Create new migration
npx prisma migrate dev --name <migration_name>

# Generate Prisma client
npx prisma generate
```

### Cleanup

```bash
docker compose down --volumes --remove-orphans
```

## Environment Variables

- `VERIFY_TOKEN`: Enable JWT verification (default: false)
- `JWT_SECRET`: Secret key for JWT verification

Priority order: `.env.local` > `.env.production.local` > `.env.production` > `.env.development.local` > `.env.development` > `.env`

## Support

Create an issue for questions or support.

## Author

Nguyen Phuc Long

## License

[MIT](LICENSE)
