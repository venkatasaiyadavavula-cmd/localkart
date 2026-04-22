FROM node:20-slim

WORKDIR /app

# Copy the pre-built 'dist' folder and package files
COPY dist ./dist
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --omit=dev

EXPOSE 3001

CMD ["node", "dist/main.js"]
