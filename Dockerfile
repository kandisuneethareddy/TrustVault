# Multi-stage Dockerfile for TrustVault Zero-Trust Platform
FROM node:20-slim AS builder

WORKDIR /app

# Copy root, backend and frontend definitions
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install

# Copy source code
WORKDIR /app
COPY backend ./backend
COPY frontend ./frontend

# Build frontend production bundle
WORKDIR /app/frontend
RUN npm run build

# Runner stage
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY package.json ./

EXPOSE 4000

# Seed database and start unified server
CMD ["node", "backend/node_modules/tsx/dist/cli.mjs", "backend/src/server.ts"]

