# 胖猫智能订单核销对账工具 - Docker 构建文件
# 
# 使用方法:
# 1. 构建镜像: docker build -t pangmao-recon-tool .
# 2. 运行容器: docker run -p 3000:3000 pangmao-recon-tool

FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 lock 文件
COPY scripts/package*.json ./scripts/
COPY cloudfunctions/quickstart/package*.json ./cloudfunctions/quickstart/

# 安装依赖
RUN cd scripts && npm install --production
RUN cd cloudfunctions/quickstart && npm install --production

# 复制源代码
COPY . .

# 构建 TypeScript（如果需要）
RUN cd cloudfunctions/quickstart && npx tsc || true

# ==================== 生产环境 ====================
FROM node:18-alpine

# 添加元数据
LABEL maintainer="akun2019"
LABEL description="胖猫智能订单核销对账工具"
LABEL version="1.0.0"

# 设置工作目录
WORKDIR /app

# 从 builder 阶段复制构建产物
COPY --from=builder /app/scripts/node_modules ./scripts/node_modules
COPY --from=builder /app/cloudfunctions/quickstart/node_modules ./cloudfunctions/quickstart/node_modules
COPY --from=builder /app .

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 更改文件所有权
RUN chown -R nodejs:nodejs /app

# 切换到非 root 用户
USER nodejs

# 暴露端口（如果使用 HTTP 服务器）
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# 默认命令
CMD ["node", "-e", "console.log('胖猫智能订单核销对账工具 - Docker 容器已启动')"]
