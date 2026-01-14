# Zeabur 后端部署 Dockerfile
FROM node:22-alpine

WORKDIR /app

# 安装所有依赖（包括 devDependencies，用于构建）
COPY package.json package-lock.json ./
RUN npm ci

# 复制 Prisma schema 和生成客户端
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# 复制源代码和配置
COPY src ./src
COPY config ./config
COPY tsconfig.json ./

# 构建 TypeScript
RUN npm run build

# 清理 devDependencies（减小镜像体积）
RUN npm prune --production

# 暴露端口
EXPOSE 3000

# 启动命令（先同步数据库结构，再启动服务）
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
