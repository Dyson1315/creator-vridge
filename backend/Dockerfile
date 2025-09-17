# Multi-stage build for Node.js backend
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies
FROM base AS dev-dependencies  
COPY package*.json ./
RUN npm ci

# Build stage
FROM dev-dependencies AS build
COPY . .
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Copy built application
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package*.json ./

# Generate Prisma client
RUN npx prisma generate

# Create uploads directory
RUN mkdir -p /app/uploads && \
    chown -R backend:nodejs /app

USER backend

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["npm", "start"]