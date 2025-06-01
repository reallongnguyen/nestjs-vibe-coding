FROM node:22-alpine3.20 AS builder

ENV NODE_ENV build

# Install pnpm globally
RUN npm install -g pnpm

USER node
WORKDIR /home/node

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY --chown=node:node . .

RUN npx prisma generate \
    && pnpm build

# ---

FROM node:22-alpine3.20

ENV NODE_ENV production

# Install pnpm globally and curl
RUN npm install -g pnpm \
    && apk add --no-cache curl

USER node
WORKDIR /home/node

COPY --from=builder --chown=node:node /home/node/package.json /home/node/pnpm-lock.yaml ./
COPY --from=builder --chown=node:node /home/node/node_modules/ ./node_modules/
COPY --from=builder --chown=node:node /home/node/dist/ ./dist/
# Copy Prisma schema and migrations for production database operations
COPY --from=builder --chown=node:node /home/node/prisma/ ./prisma/

CMD ["pnpm", "start:prod"]
