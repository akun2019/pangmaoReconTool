# 占位 Dockerfile - 仅用于满足抖音云持续交付流水线要求
# 注意：本项目实际使用 Serverless 云函数部署，不需要此文件

FROM alpine:latest
CMD ["echo", "This is a placeholder for CI/CD pipeline"]
