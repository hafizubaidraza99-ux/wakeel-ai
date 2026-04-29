# Use an official Node.js runtime as a parent image
FROM node:20-slim AS builder

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application (Vite build + TypeScript check)
RUN npm run build

# Production image
FROM node:20-slim

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --production

# Install tsx globally or copy it from builder if needed for server.ts
# Alternatively, use a build step for server.ts to CJS/ESM
# For simplicity with the environment, we use tsx in production if not compiled
RUN npm install -g tsx

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/.env.example ./

# Expose port
EXPOSE 3000

# Start the application
# Cloud Run expects the app to listen on the port defined by $PORT
CMD ["tsx", "server.ts"]
