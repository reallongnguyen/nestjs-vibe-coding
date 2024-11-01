# API Service

This repository houses the backend API service for [Your System Name], providing lightweight CRUD operations for various resources.

## Key Features

- Robust Data Layer: Leverages Prisma ORM for efficient data access and manipulation.
- Enhanced Security: Implements JWT-based authentication and role-based authorization to safeguard sensitive data.
- Reliable Error Handling: Utilizes a custom error mapping system to gracefully handle and respond to errors.
- Automated Documentation: Generates OpenAPI documentation for easy API consumption and integration.
- Code Quality Assurance: Enforces code quality standards with ESLint and automated linting fixes.
- Scalability and Flexibility: Designed with microservices architecture principles in mind, allowing for easy scaling and independent module deployment.
- Adaptability: Built to accommodate future technological advancements and evolving business requirements.

## Philosophy

Microservices-First Approach

We embrace a microservices-first approach to design and develop our API service. This means that each module within the src/modules directory is designed to be self-contained and independently deployable.

### Key Principles

Loose Coupling

- Minimal Dependencies: Modules should rely only on shared common utilities and interfaces, minimizing direct dependencies on other modules.
- Communication Protocols: Modules should communicate with each other using well-defined protocols like HTTP, gRPC, or message brokers, rather than direct code imports. This promotes flexibility and isolation.

Scalability

- Horizontal Scaling: Our system is designed to handle increasing load by adding more instances of individual modules. This allows for efficient scaling of specific components as needed.
- Performance Optimization: We employ techniques like caching, asynchronous processing, and database optimization to ensure optimal performance under heavy load.

Adaptability

- Technology Agnostic: We strive to minimize vendor lock-in by using modular and interchangeable components. This allows us to easily adopt new technologies and frameworks as needed.
- Configuration-Driven: We use configuration files and environment variables to manage system behavior, making it easier to adapt to different environments and configurations.

Continuous Improvement

- Experimentation: We encourage a culture of experimentation and innovation. By trying new approaches and technologies, we can identify opportunities for improvement and optimize our system.
- Feedback Loops: We gather feedback from users, monitoring tools, and performance metrics to continuously refine our system and address potential issues.

By adhering to these principles, we aim to build a robust, scalable, and maintainable API service that can evolve with the changing needs of our business.

## Getting Started

### Clone the Repository and Install Dependencies

```bash
git clone https://github.com/reallongnguyen/base-api-service.git && cd base-api-service
yarn install
```

This command will clone the repository and install all necessary dependencies using `yarn`.

### Set Up Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file to configure your environment variables.

#### Important Note

- By default, JWT token verification is disabled because it's assumed to be handled by an external API Gateway (see [infra/docker/README.md](infra/docker/README.md)).
- If you run the API Service as a standalone service, enable JWT verification by setting `VERIFY_TOKEN=true` and providing your secret key with `JWT_SECRET`.

#### Environment Variable Loading Priority

You can create additional environment files to configure different environments. These files will be loaded in the following order (highest priority first):

1. .env.local
2. .env.production.local
3. .env.production
4. .env.development.local
5. .env.development
6. .env

Please Note: Prisma ORM and Docker Compose only read environment variables from the `.env` file.

### Running Dependent Services (Local Development Only)

To run dependencies like Postgres, Redis, and MQTT locally, use Docker Compose:

```bash
# Start dependent services in detached mode
docker compose up -d

# Migrate the database schema using Prisma ORM
npx prisma db push
```

### Starting the Server

#### Development Mode (Watch Mode)

```bash
yarn run start:dev
```

This command starts the server in development mode, enabling automatic code reloading when changes are detected.

#### Production Mode

Build the production-ready version of the API Service

```bash
yarn build
```

Start the server in production mode

```bash
yarn run start:prod
```

This command starts the server in production mode, optimized for performance and stability.

### Testing Your API

Once the server is running, you can test your API functionalities using a variety of methods:

#### API Documentation

Navigate to `http://localhost:8000/api` in your web browser to access the interactive API documentation. This interface allows you to explore available endpoints, view request parameters and responses, and even interact with the API directly.

#### Command-Line Tools

Use tools like curl to send HTTP requests to your API and examine the responses. Here's an example of using curl to check the API's health endpoint:

```bash
curl --location 'localhost:8000/health' \
--header 'Authorization: Bearer <YOUR JWT>'
```

#### Postman

For a more user-friendly experience, consider using a tool like Postman. Postman allows you to create and send requests, visualize responses, manage environment variables, and explore different authentication methods (including JWT).

#### JWT Token Retrieval

JWT tokens are typically generated by a separate authentication service. For testing purposes, you have two options:

Authorization Service:

If you have a separate authentication service running (as mentioned in [infra/docker/README.md](infra/docker/README.md)), follow its instructions to obtain a valid JWT token after successful login.

JWT.io (Testing Only):

For quick testing without a full authentication setup, you can temporarily generate JWT tokens using a website like jwt.io. However, keep in mind that tokens generated on this website are not secure and should not be used in a production environment.

```json
# Header
{
  "alg": "HS256",
  "typ": "JWT"
}

# PAYLOAD
{
  "sub": "86f41bd0-a011-45a2-837d-36ff38f6e8da",
  "exp": 8888888888,
  "iat": 1729177102
}
```

Remember:

- Replace `<YOUR JWT>` with the actual JWT token obtained from your authentication service or generated temporarily on jwt.io.
- Ensure your API expects JWT authorization and is configured to verify the token's signature.

By following these steps, you can effectively test and interact with your API.

### Clean up

```bash
# Stop all dockers and remove volumes
docker compose down --volumes --remove-orphans
```

## Using the Prisma ORM

### Migrate DB & generate models from the exist schema

```bash
# The db push command pushes the state of your Prisma schema file to the database without using migrations. It creates the database if the database does not exist
npx prisma db push

# The generate command generates assets like Prisma Client based on the generator and data model blocks defined in your prisma/schema.prisma file
npx prisma generate
```

### Create the new migration

```bash
# For use in development environments only, requires shadow database
npx prisma migrate dev --name <migration_name>
```

### Other commands

```bash
# Drop the database and re-create a new database
npx prisma migrate reset

# The migrate deploy command applies all pending migrations, and creates the database if it does not exist. Primarily used in non-development environments
prisma migrate deploy
```

See other commands: [prisma-cli-reference](https://www.prisma.io/docs/orm/reference/prisma-cli-reference)

### Ref

- [Prisma Overview](https://www.prisma.io/docs/orm/prisma-schema/overview)
- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate/getting-started)

## Support

Feel free to ask me by create new issue.

## Stay in touch

- Author - Nguyen Phuc Long

## License

[MIT licensed](LICENSE).
