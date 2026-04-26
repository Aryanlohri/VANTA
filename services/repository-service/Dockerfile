FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/api-gateway/package.json ./services/api-gateway/
COPY services/auth-service/package.json ./services/auth-service/
COPY services/repository-service/package.json ./services/repository-service/
COPY services/review-service/package.json ./services/review-service/
COPY services/ai-service/package.json ./services/ai-service/
COPY client/package.json ./client/
RUN npm install --workspace=services/repository-service --workspace=packages/shared

# Copy source
COPY packages/shared/ ./packages/shared/
COPY services/repository-service/ ./services/repository-service/
COPY tsconfig.base.json ./

# Build shared package first, then service
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/repository-service

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/packages/shared/package.json ./packages/shared/
COPY --from=base /app/services/repository-service/dist ./services/repository-service/dist
COPY --from=base /app/services/repository-service/package.json ./services/repository-service/
COPY --from=base /app/package.json ./

RUN npm install --workspace=services/repository-service --omit=dev

EXPOSE 3002
CMD ["node", "services/repository-service/dist/index.js"]
