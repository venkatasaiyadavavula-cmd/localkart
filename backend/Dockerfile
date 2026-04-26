FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy the pre-built dist folder (you will build this locally)
COPY dist ./dist

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "dist/main.js"]
