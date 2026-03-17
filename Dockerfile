# Build stage
FROM node:24-alpine AS build
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy monorepo metadata
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy workspace source
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build API server
RUN pnpm --filter @zap-auto/api-server build

# Production stage
FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy built output and dependencies
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/artifacts/api-server/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.cjs"]
