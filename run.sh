#!/bin/sh
# FaaS 平台启动脚本
# 注意：本项目设计为抖音云开发 Serverless 架构，此脚本仅用于兼容 FaaS 平台

echo "Starting Pangmao Recon Tool..."

# 设置环境变量
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-8000}

# 检查是否有 package.json
if [ ! -f "/opt/application/package.json" ]; then
    echo "Error: package.json not found"
    exit 1
fi

# 安装依赖（如果 node_modules 不存在）
if [ ! -d "/opt/application/node_modules" ]; then
    echo "Installing dependencies..."
    cd /opt/application
    npm install --production
fi

# 启动 Node.js 应用
# 注意：这需要创建一个 Express/Koa HTTP 服务器来包装云函数
echo "Starting application on port $PORT..."
cd /opt/application

# 如果有 server.js，则启动它
if [ -f "server.js" ]; then
    node server.js
else
    echo "Error: server.js not found. This project is designed for Douyin Cloud Functions, not FaaS."
    echo "Please use Douyin Cloud Development console to deploy instead."
    exit 1
fi
