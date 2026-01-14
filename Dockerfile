# Zeabur 后端部署 Dockerfile
FROM node:22-alpine

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 复制 Prisma schema 和生成客户端
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# 复制编译后的代码和配置
COPY dist ./dist
COPY config ./config

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/index.js"]
