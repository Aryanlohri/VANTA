FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/api-gateway/package.json ./services/api-gateway/
COPY services/auth-service/package.json ./services/auth-service/
COPY services/repository-service/package.json ./services/repository-service/
COPY services/review-service/package.json ./services/review-service/
COPY services/ai-service/package.json ./services/ai-service/
COPY client/package.json ./client/
RUN npm install --workspace=services/api-gateway --workspace=packages/shared

COPY packages/shared/ ./packages/shared/
COPY services/api-gateway/ ./services/api-gateway/
COPY tsconfig.base.json ./

RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=services/api-gateway

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/packages/shared/dist ./packages/shared/dist
COPY --from=base /app/packages/shared/package.json ./packages/shared/
COPY --from=base /app/services/api-gateway/dist ./services/api-gateway/dist
COPY --from=base /app/services/api-gateway/package.json ./services/api-gateway/
COPY --from=base /app/package.json ./

RUN npm install --workspace=services/api-gateway --omit=dev

EXPOSE 3000
CMD ["node", "services/api-gateway/dist/index.js"]
