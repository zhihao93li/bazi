# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build
# 调试：确保构建产物生成
RUN echo "Checking build output..." && ls -la dist && ls -la dist/assets

# Production Stage
FROM caddy:2-alpine

WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY Caddyfile ./Caddyfile

# 关键：修复权限问题，确保 Caddy 能读取文件
RUN chmod -R 755 /app/dist

# Railway automatically injects the PORT environment variable
CMD ["caddy", "run", "--config", "Caddyfile", "--adapter", "caddyfile"]
