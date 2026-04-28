# Multi-stage build for Next.js
FROM node:20-slim AS base
ENV npm_config_update_notifier=false

# Install dependencies only when needed
FROM base AS deps
# Build/runtime libs frequently needed by native Node modules on node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libc6 \
    libc6-dev \
    openssl \
    ca-certificates \
    build-essential \
    python3 \
    pkg-config \
    git \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
ENV npm_config_update_notifier=false
ENV npm_config_cache=/tmp/.npm
ENV npm_config_build_from_source=false
ENV npm_config_include=optional
ENV npm_config_platform=linux
ENV npm_config_arch=x64
ENV CXXFLAGS=-march=x86-64
ENV CFLAGS=-march=x86-64
# Use npm install with legacy-peer-deps to handle peer dependency conflicts
# --legacy-peer-deps handles peer dependency conflicts (e.g., eslint versions)
# --prefer-offline uses cache when available, --no-audit skips security audit
# Force prebuilt binaries where available (not source builds), then ensure
# node-addon-api is available for native modules that still require it.
RUN npm install --prefer-offline --no-audit --legacy-peer-deps --no-build-from-source --include=optional \
    && npm install --no-save node-addon-api \
    && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] pin sharp baseline-compatible start" \
    && npm install --no-save --include=optional --os=linux --cpu=x64 sharp@0.34.5 \
    && node -e "const v=require('sharp/package.json').version; console.log('['+new Date().toISOString()+'] sharp version in image deps:', v)" \
    && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] pin sharp baseline-compatible done"

# Rebuild the source code only when needed
FROM base AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    build-essential \
    python3 \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Keep V8 heap capped to avoid host OOM killer (exit 137) on low-memory servers.
# Override when needed: docker build --build-arg NEXT_BUILD_MAX_OLD_SPACE=1536 .
ARG NEXT_BUILD_MAX_OLD_SPACE=1024
ENV NODE_OPTIONS=--max-old-space-size=${NEXT_BUILD_MAX_OLD_SPACE}

# Placeholder DB URL for prisma generate during image build
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=${DATABASE_URL}

# Generate Prisma Client
RUN echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] prisma generate start" && npx prisma generate && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] prisma generate done"

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] npm run build start (NODE_OPTIONS=${NODE_OPTIONS})" && npm run build && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] npm run build done"

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install wget for healthcheck, openssl for Prisma
RUN apt-get update && apt-get install -y wget ca-certificates openssl libvips42 && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/next-i18next.config.js ./next-i18next.config.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder /app/node_modules/@img ./node_modules/@img
COPY --from=builder /app/node_modules/pg ./node_modules/pg
COPY --from=builder /app/prisma ./prisma

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# PORT will be set from .env via docker-compose
# EXPOSE is for documentation only, actual port is set via environment variable
ARG PORT
EXPOSE ${PORT}
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

