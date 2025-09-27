# Multi-stage Dockerfile for optimal production build

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
# Frontend build
RUN npm run build

# Manually build production server (without vite dependencies)
RUN npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/production.js

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose the port that your app runs on
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: '127.0.0.1', port: process.env.PORT || 5000, path: '/api/health', timeout: 2000 }; const req = http.request(options, (res) => { res.statusCode === 200 ? process.exit(0) : process.exit(1) }); req.on('error', () => process.exit(1)); req.end();"

# Start the application (production server without vite)
CMD ["node", "dist/production.js"]