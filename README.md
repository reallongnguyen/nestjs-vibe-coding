# API Service

## Description

The API service handles lightweight CRUD API in your system

### Installed toys

- Prisma ORM
- Logging
- Authentication by JWT Token & Authorization by Role
- Error mapping: you define an error mapping file and server convert App Error to HTTP response
- Auto generate Open API document
- Eslint & Auto run fix-lint before git commit
- Other: cahce, queue, event emitter, validate input... etc

### Philosophy

All modules in `src/modules` should ready to become an independent micoservice

- A module shoulds not depend on implement of other module except common module in `src/common`
- A module should communicate with other one via event emitter, message broker, restful API, gRPC... instead of import code

Build for scale in mind

- Let's imagine our system deal with 1M DAU
- We start simple but always prepare plan to scale our system efficiently

Dealing with change

- Technology grow very fast. Your bussiness change is slower than technology
- Our project should change framework, database and other external services easily with small impact to core business

Improvement development experiment

### Todo

- Add widely-used modules such as notification, user management...
- Add deploy manual about running API Service in production-ready microservice system. See [daft](infra/docker/README.md)
- Apply Adapter-Port Architecture for each module

## Running Service

### Installation

```bash
yarn install
```

### Preparation environment variables `.env`

```bash
cp .env.example .env
```

Let change values in `.env` file.
By default, API Service doesn't verify JWT Token because we will do it at [API Gateway](infra/docker/README.md). Incase you run API Service as a standalone service, you should enable verify JWT feature by set ENV variable `VERIFY_TOKEN=true` and set your `JWT_SECRET`.

You can add other environment files to modify ENV variables in API Service depend on running environment. This list is in decrement priority:

- `.env.local`
- `.env.production.local`
- `.env.production`
- `.env.development.local`
- `.env.development`
- `.env`

Please inform **Prisma ORM & Docker compose are accept only `.env` file**

### Running the depend services

In the local, you can use Docker to start depend services:

- Postgres
- Redis
- MQTT

Running dependency and migration Prisma ORM

```bash
# Create dockers
docker compose up -d

# Migrate database
npx prisma db push
```

### Running the server

```bash
# development, watch mode
yarn run start:dev

# production mode
yarn build
yarn run start:prod
```

### Test your API

After server running, API docs will be showed at [http://localhost:8000/api](http://localhost:8000/api)

You can interact with API throught API docs page, curl or Postman. Here is a curl example:

```bash
curl --location 'localhost:8000/health' \
--header 'Authorization: Bearer <YOUR JWT>'
```

You will receive JWT Token after login via [Auth Service](infra/docker/README.md) and attach token to request's header.

Just for testing, you can create JWT Token quickly on [jwt.io](https://jwt.io/) with following configuration.

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

### Clean up

```bash
# Stop all dockers and remove volumes
docker compose down --volumes --remove-orphans
```

## Test

```bash
# unit tests
yarn run test

# e2e tests
yarn run test:e2e

# test coverage
yarn run test:cov
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
