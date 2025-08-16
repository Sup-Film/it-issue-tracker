FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm globally
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm

# Copy workspace and build frontend
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter frontend build

FROM node:20-alpine AS runtime
WORKDIR /app

# Install pnpm to allow installing production deps
RUN npm install -g pnpm

# Copy built frontend artifacts and package files
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/node_modules ./node_modules
# Ensure the package-level node_modules (contains .bin/next) exists in runtime
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/pnpm-lock.yaml ./

WORKDIR /app/frontend

EXPOSE 3000
CMD ["pnpm", "start"]