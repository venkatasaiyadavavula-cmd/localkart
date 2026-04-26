echo 'FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]' > Dockerfile
