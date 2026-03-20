# Stage 1: Install ALL dependencies (including devDependencies for build)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Build args for public env vars (baked into client bundle at build time)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_RUDDERSTACK_WRITE_KEY
ARG NEXT_PUBLIC_RUDDERSTACK_DATA_PLANE_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_RUDDERSTACK_WRITE_KEY=$NEXT_PUBLIC_RUDDERSTACK_WRITE_KEY
ENV NEXT_PUBLIC_RUDDERSTACK_DATA_PLANE_URL=$NEXT_PUBLIC_RUDDERSTACK_DATA_PLANE_URL

RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
