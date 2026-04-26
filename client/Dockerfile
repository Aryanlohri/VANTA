FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy all workspace package.jsons for npm ci to resolve correctly
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/api-gateway/package.json ./services/api-gateway/
COPY services/auth-service/package.json ./services/auth-service/
COPY services/repository-service/package.json ./services/repository-service/
COPY services/review-service/package.json ./services/review-service/
COPY services/ai-service/package.json ./services/ai-service/
COPY client/package.json ./client/
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/ ./

# Copy source
COPY packages/shared/ ./packages/shared/
COPY client/ ./client/
COPY tsconfig.base.json ./

# Build shared package first, then Next.js client
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=client

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/client/.next/static ./client/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/client/public ./client/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
CMD HOSTNAME="0.0.0.0" node client/server.js
