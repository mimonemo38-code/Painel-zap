# Build stage
FROM node:24-alpine AS build
WORKDIR /app

# Copy monorepo metadata
COPY package.json package-lock.json pnpm-workspace.yaml ./

# Copy workspace source
COPY . .

# Install dependencies
RUN npm install

# Build API server
RUN npm run build

# Production stage
FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy built output and dependencies
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/artifacts/api-server/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
