# 抖音云函数部署说明

本项目使用抖音云开发平台部署，**不需要 Docker 容器化**。

## 📦 部署方式

### 方式一：抖音云控制台手动部署（推荐）

1. **登录抖音云控制台**
   - 访问：https://developer.open-douyin.com/

2. **创建云函数**
   - 进入"云开发" → "云函数"
   - 点击"创建云函数"
   - 函数名称：`quickstart`
   - 运行环境：Node.js 18

3. **上传代码**
   - 将 `cloudfunctions/quickstart` 目录打包为 ZIP
   - 或者直接在控制台编辑代码

4. **配置依赖**
   - 确保 `package.json` 包含所需依赖
   - 云端会自动安装依赖

5. **配置 HTTP 路由**
   - 进入"HTTP 触发器"
   - 添加以下路由：

| 路径 | 方法 | 云函数 |
|------|------|--------|
| `/upload_file` | POST | upload_file |
| `/parse_and_import_orders` | POST | parse_and_import_orders |
| `/parse_and_import_verifications` | POST | parse_and_import_verifications |
| `/parse_and_import_cashflows` | POST | parse_and_import_cashflows |
| `/get_import_status` | POST | get_import_status |
| `/run_reconciliation` | POST | run_reconciliation |
| `/get_discrepancy_list` | POST | get_discrepancy_list |
| `/get_reconciliation_summary` | POST | get_reconciliation_summary |

6. **部署并发布**
   - 点击"部署"按钮
   - 等待部署完成

---

### 方式二：使用抖音云 CLI（可选）

```bash
# 安装抖音云 CLI
npm install -g @open-dy/cli

# 登录
dy login

# 部署云函数
dy cloud function deploy --name quickstart --path cloudfunctions/quickstart
```

---

## ⚠️ 重要说明

### 为什么不需要 Docker？

抖音云开发是 **Serverless 平台**，具有以下特点：

1. **自动扩缩容** - 无需关心服务器资源
2. **按需计费** - 按实际调用次数和时长计费
3. **免运维** - 无需管理容器和基础设施
4. **快速部署** - 直接上传代码即可

### Docker 文件的用途

项目中的 `Dockerfile` 和 `docker-compose.yml` 仅用于：
- 本地开发和测试
- 其他云平台部署参考
- **不用于抖音云部署**

---

## 🔧 数据库配置

### 创建数据库集合

在抖音云控制台创建以下集合：
- `orders`
- `verification_records`
- `cash_flow_records`
- `discrepancy_records`
- `import_batches`

参考文档：[doc/DATABASE_SETUP.md](doc/DATABASE_SETUP.md)

### 创建索引

使用脚本自动创建索引：
```bash
cd scripts
npm install
npm run create-indexes
```

参考文档：[doc/DATABASE_INDEX_GUIDE.md](doc/DATABASE_INDEX_GUIDE.md)

---

## 📝 环境变量配置

在抖音云控制台的"环境变量"中配置：

```bash
# 数据库配置（如果使用外部 MongoDB）
MONGODB_URI=mongodb://username:password@host:port/database
DB_NAME=pangmao_recon

# 其他配置
NODE_ENV=production
```

**注意**：如果使用抖音云数据库，无需配置 `MONGODB_URI`，SDK 会自动连接。

---

## 🚀 快速开始

详细部署步骤请参考：
- [QUICK_START.md](QUICK_START.md) - 快速启动指南
- [DELIVERY_CHECKLIST.md](DELIVERY_CHECKLIST.md) - 完整交付清单

---

## ❓ 常见问题

### Q: 本地 TypeScript 报错怎么办？

A: 这是正常的，某些 SDK 仅在云端可用。忽略本地错误，关注云端部署效果。

### Q: 如何查看日志？

A: 在抖音云控制台 → 云函数 → 日志查询

### Q: 如何调试？

A: 使用 `console.log()` 输出日志，在控制台查看

---

**祝您部署顺利！** 🎉
