# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY . .

# Build the application with increased memory limit
RUN NODE_OPTIONS="--max-old-space-size=384" npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy built application and package files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

EXPOSE 3001

CMD ["node", "dist/main.js"]
