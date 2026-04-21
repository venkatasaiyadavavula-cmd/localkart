# Use Node.js LTS version
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application with increased memory
RUN NODE_OPTIONS="--max-old-space-size=512" npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Copy built application and production dependencies
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --only=production

# Expose the port (adjust if needed)
EXPOSE 3001

# Start the server
CMD ["node", "dist/main.js"]
