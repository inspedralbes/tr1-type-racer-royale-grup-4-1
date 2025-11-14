# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend files from build context (root)
COPY frontend/package*.json ./
COPY frontend/ ./

RUN npm ci
RUN npm run build

FROM node:22-alpine
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./dist

EXPOSE 3000
CMD ["node", "server.js"]



