# 多阶段构建：先编译 TypeScript 云函数，再打包运行环境
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件并安装
COPY cloudfunctions/quickstart/package*.json ./cloudfunctions/quickstart/
RUN cd cloudfunctions/quickstart && npm install --production

# 复制云函数源码并编译
COPY cloudfunctions/quickstart/tsconfig.json ./cloudfunctions/quickstart/
COPY cloudfunctions/quickstart/*.ts ./cloudfunctions/quickstart/
RUN cd cloudfunctions/quickstart && npx tsc || true

# 运行阶段
FROM node:18-alpine

WORKDIR /app

# 复制 run.sh 启动脚本（FaaS 平台必须）
COPY run.sh /opt/application/run.sh
RUN chmod +x /opt/application/run.sh

# 复制 server.js 和 package.json
COPY server.js /opt/application/server.js
COPY package.json /opt/application/package.json

# 从构建阶段复制已编译的云函数
COPY --from=builder /app/cloudfunctions/quickstart/node_modules /opt/application/cloudfunctions/quickstart/node_modules
COPY --from=builder /app/cloudfunctions/quickstart /opt/application/cloudfunctions/quickstart

# 安装 Express 运行时依赖
RUN cd /opt/application && npm install --production express cors body-parser 2>/dev/null || true

# FaaS 平台要求暴露 8000 端口
EXPOSE 8000
