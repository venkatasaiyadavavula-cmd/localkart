# Use Node.js LTS version
FROM node:20-slim

WORKDIR /app

# Copy the pre-built 'dist' folder and package files
COPY dist ./dist
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --omit=dev

# Expose the port
EXPOSE 3001

# Start the server
CMD ["node", "dist/main.js"]
