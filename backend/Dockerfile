FROM node:20-slim

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the pre-built 'dist' folder
COPY dist ./dist

# Expose the port
EXPOSE 3001

# Start the server
CMD ["node", "dist/main.js"]
