FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Keep ts-node for migrations, remove other dev dependencies
RUN npm uninstall nodemon jest @types/jest @types/supertest supertest

EXPOSE 3001

CMD ["sh", "-c", "npm run db:migrate && npm start"]