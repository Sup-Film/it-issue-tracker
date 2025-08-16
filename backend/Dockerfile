# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable

# ติดตั้ง deps ให้ build ได้
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
RUN pnpm fetch && pnpm -r install -r --offline

# คอมไพล์ backend
COPY . .
WORKDIR /app/backend
RUN pnpm prisma generate --schema=prisma/schema.prisma
RUN pnpm build

# ทำให้ node_modules เหลือเฉพาะโปรดักชันตั้งแต่ตอนนี้
# Keep devDependencies available in the image so prisma CLI and ts-node are present
# If image size is a concern, consider moving prisma to dependencies and compiling seed to JS
# then pruning devDependencies.

# ---- runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app/backend

# Provide pnpm in runtime to support compose commands using pnpm
RUN npm install -g pnpm

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/scripts ./scripts
RUN chmod +x ./scripts/entrypoint.sh

EXPOSE 8080
CMD ["./scripts/entrypoint.sh"]
