FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/auth-service/package.json ./services/auth-service/

RUN npm install --workspace=services/auth-service --workspace=packages/shared

# Copy source
COPY packages/shared/ ./packages/shared/
COPY services/auth-service/ ./services/auth-service/
COPY tsconfig.base.json ./

# Build shared package first, then service
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/auth-service

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/packages/shared/package.json ./packages/shared/
COPY --from=base /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=base /app/services/auth-service/package.json ./services/auth-service/
COPY --from=base /app/package.json ./

RUN npm install --workspace=services/auth-service --omit=dev

EXPOSE 3001
CMD ["node", "services/auth-service/dist/index.js"]
