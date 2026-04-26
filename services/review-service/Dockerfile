FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/review-service/package.json ./services/review-service/

RUN npm install --workspace=services/review-service --workspace=packages/shared

# Copy source
COPY packages/shared/ ./packages/shared/
COPY services/review-service/ ./services/review-service/
COPY tsconfig.base.json ./

# Build shared package first, then service
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/review-service

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/packages/shared/package.json ./packages/shared/
COPY --from=base /app/services/review-service/dist ./services/review-service/dist
COPY --from=base /app/services/review-service/package.json ./services/review-service/
COPY --from=base /app/package.json ./

RUN npm install --workspace=services/review-service --omit=dev

EXPOSE 3003
CMD ["node", "services/review-service/dist/index.js"]
