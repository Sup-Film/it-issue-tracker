FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm globally
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm

# Copy workspace and install deps
COPY . .
RUN pnpm install --frozen-lockfile

# Build only the webhook-listener package (tsc -> dist)
WORKDIR /app/webhook-listener
RUN pnpm build

FROM node:20-alpine AS runtime
WORKDIR /app

# Copy built artifacts and package metadata
COPY --from=builder /app/webhook-listener/dist ./webhook-listener/dist
COPY --from=builder /app/webhook-listener/package.json ./webhook-listener/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/webhook-listener/node_modules ./webhook-listener/node_modules

WORKDIR /app/webhook-listener

EXPOSE 4000
CMD ["node", "dist/index.js"]