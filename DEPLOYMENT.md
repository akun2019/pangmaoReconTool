# 抖音云函数部署说明

## ⚠️ 重要说明

**本项目是抖音云 Serverless 项目，不需要 Docker 容器化！**

- ✅ **技术栈**: TypeScript + Node.js + 抖音云函数
- ❌ **不是**: Java Spring Boot 或其他容器化应用
- ❌ **不需要**: Docker 镜像、run.sh、容器编排

---

## 📦 部署方式

### 方式一：抖音云控制台手动部署（✅ 推荐）

这是最简单、最推荐的部署方式。

#### 1. 登录抖音云控制台

访问：https://developer.open-douyin.com/

#### 2. 创建云函数

1. 进入"云开发" → "云函数"
2. 点击"创建云函数"
3. 配置如下：
   - **函数名称**: `quickstart`
   - **运行环境**: Node.js 18
   - **内存**: 512MB（可根据需要调整）
   - **超时时间**: 30秒

#### 3. 上传代码

有两种方式：

**方式 A: ZIP 包上传**
```bash
# 在项目根目录执行
cd cloudfunctions/quickstart
zip -r ../quickstart.zip .
```
然后在控制台上传 `quickstart.zip`

**方式 B: 在线编辑**
- 直接在控制台创建文件
- 复制粘贴代码内容

#### 4. 安装依赖

在云函数编辑页面：
1. 确保 `package.json` 包含以下依赖：
```json
{
  "dependencies": {
    "@open-dy/node-server-sdk": "^1.0.0",
    "xlsx": "^0.18.5"
  }
}
```
2. 云端会自动安装依赖

#### 5. 配置 HTTP 路由

进入"HTTP 触发器"或"API 网关"配置：

| 路径 | 方法 | 云函数入口 | 说明 |
|------|------|-----------|------|
| `/upload_file` | POST | upload_file | 文件上传 |
| `/parse_and_import_orders` | POST | parse_and_import_orders | 订单导入 |
| `/parse_and_import_verifications` | POST | parse_and_import_verifications | 核销导入 |
| `/parse_and_import_cashflows` | POST | parse_and_import_cashflows | 流水导入 |
| `/get_import_status` | POST | get_import_status | 导入状态查询 |
| `/run_reconciliation` | POST | run_reconciliation | 执行对账 |
| `/get_discrepancy_list` | POST | get_discrepancy_list | 差异列表查询 |
| `/get_reconciliation_summary` | POST | get_reconciliation_summary | 概览统计查询 |

#### 6. 部署并发布

1. 点击"部署"按钮
2. 等待部署完成（约 1-2 分钟）
3. 测试 API 是否正常工作

---

### 方式二：使用抖音云 CLI（可选）

适合自动化部署场景。

#### 1. 安装 CLI

```bash
npm install -g @open-dy/cli
```

#### 2. 登录

```bash
dy login
```

#### 3. 部署云函数

```bash
# 部署单个云函数
dy cloud function deploy \
  --name quickstart \
  --path cloudfunctions/quickstart \
  --runtime nodejs18

# 或者部署所有云函数
dy cloud function deploy-all
```

#### 4. 配置 HTTP 路由

```bash
dy cloud http-trigger create \
  --function-name quickstart \
  --path /upload_file \
  --method POST
```

---

## 🔧 数据库配置

### 1. 创建数据库集合

在抖音云控制台 → "云数据库"中创建以下集合：

- ✅ `orders` - 订单数据
- ✅ `verification_records` - 核销记录
- ✅ `cash_flow_records` - 收银流水
- ✅ `discrepancy_records` - 差异记录
- ✅ `import_batches` - 导入批次

详细步骤参考：[doc/DATABASE_SETUP.md](doc/DATABASE_SETUP.md)

### 2. 创建索引

使用脚本自动创建 17 个优化索引：

```bash
cd scripts
npm install
cp .env.example .env
# 编辑 .env，填入数据库连接信息
npm run create-indexes
```

预期效果：查询速度提升 **80-95%**

详细指南参考：[doc/DATABASE_INDEX_GUIDE.md](doc/DATABASE_INDEX_GUIDE.md)

---

## 📝 环境变量配置

在抖音云控制台的"环境变量"中配置（如需要）：

```bash
# 如果使用外部 MongoDB（可选）
MONGODB_URI=mongodb://username:password@host:port/database
DB_NAME=pangmao_recon

# 运行环境
NODE_ENV=production
```

**注意**：如果使用抖音云自带的云数据库，无需配置 `MONGODB_URI`，SDK 会自动连接。

---

## 🚀 完整部署流程

按照以下步骤完成整个系统的部署：

### 第一步：准备环境（10分钟）

1. ✅ 注册抖音云账号
2. ✅ 创建云开发环境
3. ✅ 开通云函数服务
4. ✅ 开通云数据库服务

### 第二步：创建数据库（15分钟）

1. ✅ 创建 5 个集合
2. ✅ 运行索引创建脚本
3. ✅ 验证索引是否生效

### 第三步：部署云函数（20分钟）

1. ✅ 上传云函数代码
2. ✅ 配置 8 个 HTTP 路由
3. ✅ 部署并发布

### 第四步：测试验证（30分钟）

1. ✅ 生成测试数据
2. ✅ 导入测试数据
3. ✅ 执行对账
4. ✅ 查询结果

详细测试步骤参考：[QUICK_START.md](QUICK_START.md)

---

## ❓ 常见问题

### Q1: 为什么不需要 Docker？

A: 抖音云是 **Serverless 平台**，具有以下特点：
- 自动扩缩容，无需管理服务器
- 按需计费，按实际调用次数和时长
- 免运维，无需管理容器和基础设施
- 快速部署，直接上传代码即可

### Q2: 本地 TypeScript 报错怎么办？

A: 这是正常的！某些 SDK（如 `@open-dy/node-server-sdk`）仅在云端可用。
- 忽略本地错误
- 关注云端部署效果
- 参考：[doc/TYPESCRIPT_COMPILE_NOTES.md](doc/TYPESCRIPT_COMPILE_NOTES.md)

### Q3: 如何查看日志？

A: 在抖音云控制台 → 云函数 → 日志查询
- 可以按时间范围筛选
- 支持关键词搜索
- 实时查看输出

### Q4: 如何调试？

A: 使用 `console.log()` 输出日志：
```typescript
console.log('调试信息', data);
```
然后在控制台查看日志。

### Q5: 部署后 API 无法访问？

A: 检查以下几点：
1. HTTP 路由是否正确配置
2. 云函数是否部署成功
3. 权限是否正确设置
4. 查看日志是否有错误

### Q6: 性能如何优化？

A: 参考以下文档：
- [doc/PERFORMANCE_OPTIMIZATION.md](doc/PERFORMANCE_OPTIMIZATION.md) - 性能优化总结
- [doc/DATABASE_INDEX_GUIDE.md](doc/DATABASE_INDEX_GUIDE.md) - 索引优化
- [doc/CACHE_USAGE_GUIDE.md](doc/CACHE_USAGE_GUIDE.md) - 缓存使用

---

## 📊 部署检查清单

部署前请确认：

- [ ] 抖音云账号已注册
- [ ] 云开发环境已创建
- [ ] 云函数服务已开通
- [ ] 云数据库服务已开通
- [ ] 5个数据库集合已创建
- [ ] 17个索引已创建
- [ ] 云函数代码已上传
- [ ] 8个HTTP路由已配置
- [ ] 依赖已安装
- [ ] 环境变量已配置（如需要）
- [ ] 测试数据已生成
- [ ] 功能测试已通过

---

## 🎯 下一步

部署完成后：

1. **生成测试数据** - 验证系统功能
2. **端到端测试** - 完整流程测试
3. **性能监控** - 观察实际运行效果
4. **用户培训** - 编写使用手册

---

**祝您部署顺利！** 🎉

如有问题，请参考：
- [QUICK_START.md](QUICK_START.md) - 快速启动指南
- [DELIVERY_CHECKLIST.md](DELIVERY_CHECKLIST.md) - 完整交付清单
- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - 项目总览
