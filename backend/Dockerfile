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

# Keep dependencies needed for runtime and migrations
RUN npm prune --production=false

EXPOSE 3001

CMD ["sh", "-c", "npm run db:migrate && npm start"]