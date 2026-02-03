# Multi-stage build for Next.js
# Force linux/amd64 so sharp binaries match production (avoids darwin/arm64 when building on Mac)
FROM --platform=linux/amd64 node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y libc6 openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
ENV npm_config_update_notifier=false
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Limit Node.js heap during build to reduce memory spike (avoids OOM/swap thrashing on low-RAM hosts)
ENV NODE_OPTIONS=--max-old-space-size=768

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install wget for healthcheck, openssl for Prisma, libvips for sharp
RUN apt-get update && apt-get install -y wget ca-certificates openssl libvips-dev && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder /app/node_modules/@img ./node_modules/@img
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

