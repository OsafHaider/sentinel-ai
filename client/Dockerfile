# ============================================================================
# Stage 1: Dependencies (cached for faster rebuilds)
# ============================================================================
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci --only=production; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile --production; \
    elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --prod; \
    else npm install --only=production; fi

# ============================================================================
# Stage 2: Builder (compile and build the Next.js app)
# ============================================================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    else npm install; fi

COPY . .
RUN npm run build

# ============================================================================
# Stage 3: Runtime (minimal production image)
# ============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy built application from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs package.json ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start application
CMD ["node", "server.js"]
