# ==============================================================================
# SANGITA TRAVELS PUNE (PUNE MUMBAI CAB) - FRONTEND DOCKERFILE
# Multi-stage build: Node.js 20 build stage -> Nginx Alpine production image
# ==============================================================================

# ----------------- Stage 1: Build Frontend Assets -----------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ----------------- Stage 2: Serve via Nginx Alpine ----------------
FROM nginx:alpine AS runner

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
