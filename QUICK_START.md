# 🚀 快速启动清单

## ⏱️ 预计总耗时：3-4 小时

---

## ✅ 前置检查清单

在开始之前，请确认：

- [ ] 已登录抖音云托管控制台
- [ ] 已创建小程序项目
- [ ] 已开通云数据库服务
- [ ] 已开通云存储服务
- [ ] Node.js 已安装（v16+）

---

## 📋 步骤 1：创建数据库集合（30分钟）

### 操作指引
参考文档：[doc/DATABASE_SETUP.md](./doc/DATABASE_SETUP.md)

### 执行步骤

1. 登录 [抖音云托管控制台](https://cloud.douyin.com/)
2. 进入您的小程序项目
3. 找到"云数据库" → "集合管理"
4. 依次创建以下 5 个集合：

```
✅ orders                    （团购订单）
✅ verification_records      （核销记录）
✅ cash_flow_records         （收银流水）
✅ discrepancy_records       （差异记录）
✅ import_batches            （导入批次）
```

5. 配置索引（重要！）：
   - `orders.order_id` → 唯一索引
   - `import_batches.batch_no` → 唯一索引
   - 其他字段按需添加普通索引

### 验证方法
在控制台查看集合列表，确认 5 个集合都已创建成功。

---

## 📋 步骤 2：生成测试数据（10分钟）

### 操作指引
参考文档：[scripts/README.md](./scripts/README.md)

### 执行命令

```bash
# 进入脚本目录
cd scripts

# 安装依赖（首次执行需要）
npm install

# 生成测试数据
npm run generate
```

### 预期输出

```
🚀 开始生成模拟测试数据...

📦 生成订单数据...
   ✓ 生成 120 条订单

✓ 生成核销记录...
   ✓ 生成 108 条核销记录

✓ 生成收银流水...
   ✓ 生成 90 条流水记录

💾 导出 Excel 文件...
✅ 文件已生成: test_data/orders_test_data.xlsx
✅ 文件已生成: test_data/verification_records_test_data.xlsx
✅ 文件已生成: test_data/cash_flow_records_test_data.xlsx

💾 导出 CSV 文件...
✅ 文件已生成: test_data/orders_test_data.csv
✅ 文件已生成: test_data/verification_records_test_data.csv
✅ 文件已生成: test_data/cash_flow_records_test_data.csv

📊 数据统计报告:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
订单总数: 120
核销记录数: 108
收银流水数: 90

预期差异分布:
  - 正常订单: ~72 条
  - 已核销但无流水: ~36 条
  - 金额不一致: ~24 条
  - 重复核销: ~12 条
  - 未核销: ~12 条
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 测试数据生成完成！
📁 文件位置: /path/to/scripts/test_data
```

### 验证方法
打开 `scripts/test_data/` 目录，确认 6 个文件已生成。

---

## 📋 步骤 3：部署云函数（60分钟）

### 操作指引
参考文档：[doc/M1_IMPLEMENTATION_GUIDE.md](./doc/M1_IMPLEMENTATION_GUIDE.md) - 任务 2

### 执行步骤

#### 3.1 准备代码包

```bash
# 确保在 cloudfunctions/quickstart 目录下
cd cloudfunctions/quickstart

# 打包代码（可选，也可直接上传文件夹）
zip -r quickstart.zip . -x "node_modules/*" ".git/*"
```

#### 3.2 在抖音云控制台创建云函数

1. 进入"云函数"模块
2. 点击"新建云函数"
3. 填写信息：
   - 函数名称：`reconciliation-service`
   - 运行时：Node.js 16（或更高版本）
   - 内存：512MB（推荐）
   - 超时时间：30秒

#### 3.3 上传代码

**方式 A：直接上传文件夹**
1. 选择"本地上传"
2. 上传 `cloudfunctions/quickstart` 整个文件夹
3. 等待上传完成

**方式 B：上传 ZIP 包**
1. 选择"ZIP 包上传"
2. 上传刚才打包的 `quickstart.zip`
3. 等待上传完成

#### 3.4 安装依赖

在云函数配置页面：
1. 找到"依赖管理"或"构建配置"
2. 确认 `package.json` 中的依赖会被自动安装
3. 如果没有自动安装，手动执行：
   ```bash
   npm install
   ```

#### 3.5 配置 HTTP 路由

在云函数的"触发器管理"或"路由配置"中，添加以下路由：

| 请求方法 | 路径 | 处理文件 |
|---------|------|----------|
| POST | `/upload_file` | upload_file.ts |
| POST | `/parse_and_import_orders` | parse_and_import_orders.ts |
| POST | `/parse_and_import_verifications` | parse_and_import_verifications.ts |
| POST | `/parse_and_import_cashflows` | parse_and_import_cashflows.ts |
| GET | `/get_import_status` | get_import_status.ts |

#### 3.6 发布函数

1. 点击"发布"或"部署"
2. 等待部署完成（约 1-2 分钟）
3. 查看部署状态为"运行中"

### 验证方法

在云函数控制台测试任意一个函数：

```javascript
// 测试 get_import_status
GET /get_import_status

// 预期响应
{
  "code": 0,
  "message": "暂无导入记录",
  "data": []
}
```

---

## 📋 步骤 4：测试导入流程（90分钟）

### 操作指引
参考文档：[doc/M1_IMPLEMENTATION_GUIDE.md](./doc/M1_IMPLEMENTATION_GUIDE.md) - 任务 4

### 测试工具

可以使用以下任一工具：
- Postman
- Apifox
- curl 命令行
- 抖音云控制台的"在线调试"功能

### 测试 4.1：上传订单文件

#### 准备工作

将 Excel 文件转换为 Base64：

```bash
# macOS/Linux
base64 -i scripts/test_data/orders_test_data.xlsx

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("scripts\test_data\orders_test_data.xlsx"))
```

或使用在线工具：https://www.base64encode.org/

#### 调用接口

```http
POST https://your-cloud-function-url/upload_file
Content-Type: application/json

{
  "fileName": "orders_test_data.xlsx",
  "fileContent": "<上一步生成的base64字符串>",
  "dataType": "orders"
}
```

#### 预期响应

```json
{
  "code": 0,
  "message": "文件上传成功",
  "data": {
    "fileId": "cloud://xxx/reconciliation/orders/BATCH_20260719_143000_123/orders_test_data.xlsx",
    "batchNo": "BATCH_20260719_143000_123",
    "cloudPath": "reconciliation/orders/BATCH_20260719_143000_123/orders_test_data.xlsx"
  }
}
```

**⚠️ 重要**: 复制 `batchNo` 和 `fileId`，下一步需要用到！

---

### 测试 4.2：导入订单数据

#### 调用接口

```http
POST https://your-cloud-function-url/parse_and_import_orders
Content-Type: application/json

{
  "batchNo": "BATCH_20260719_143000_123",
  "fileId": "cloud://xxx/reconciliation/orders/BATCH_xxx/orders_test_data.xlsx"
}
```

#### 预期响应

```json
{
  "code": 0,
  "message": "导入成功",
  "data": {
    "totalRecords": 120,
    "successRecords": 120,
    "failedRecords": 0,
    "errors": []
  }
}
```

#### 验证数据

在抖音云数据库控制台：
1. 进入 `orders` 集合
2. 查看数据条数应为 120 条
3. 随机抽查几条数据，确认格式正确

---

### 测试 4.3：查询导入状态

#### 调用接口

```http
GET https://your-cloud-function-url/get_import_status?batchNo=BATCH_20260719_143000_123
```

#### 预期响应

```json
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "batch_no": "BATCH_20260719_143000_123",
    "data_type": "orders",
    "file_name": "orders_test_data.xlsx",
    "total_records": 120,
    "success_records": 120,
    "failed_records": 0,
    "status": "completed",
    "error_log": [],
    "imported_at": "2026-07-19T14:30:00.000Z"
  }
}
```

---

### 测试 4.4：重复测试核销和流水

按照相同流程，依次测试：

#### 核销记录导入

```http
POST /upload_file
{
  "fileName": "verification_records_test_data.xlsx",
  "fileContent": "<base64>",
  "dataType": "verification"
}

POST /parse_and_import_verifications
{
  "batchNo": "<新批次号>",
  "fileId": "<新fileId>"
}
```

#### 收银流水导入

```http
POST /upload_file
{
  "fileName": "cash_flow_records_test_data.xlsx",
  "fileContent": "<base64>",
  "dataType": "cash_flow"
}

POST /parse_and_import_cashflows
{
  "batchNo": "<新批次号>",
  "fileId": "<新fileId>"
}
```

---

### 测试 4.5：验证数据完整性

在抖音云数据库控制台检查：

| 集合 | 预期数据量 | 检查要点 |
|------|-----------|----------|
| orders | 120 条 | order_id 唯一，日期格式正确 |
| verification_records | ~108 条 | 包含重复核销场景 |
| cash_flow_records | ~90 条 | 部分记录无 order_id |
| import_batches | 3 条 | 对应三次导入 |

---

## 📋 步骤 5：（可选）开发前端导入页面（2-3小时）

如果需要提供可视化界面，可以参考以下步骤：

### 5.1 创建导入页面

创建文件：`pages/import/import.ts` 和 `pages/import/import.wxml`

### 5.2 实现文件选择

```typescript
// pages/import/import.ts
Page({
  data: {
    dataType: 'orders',
    uploading: false
  },
  
  chooseFile() {
    tt.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0];
        this.uploadAndImport(file);
      }
    });
  }
});
```

### 5.3 调用云函数

详细代码参考：[doc/M1_IMPLEMENTATION_GUIDE.md](./doc/M1_IMPLEMENTATION_GUIDE.md) - 任务 5

---

## ✅ M1 验收清单

完成以上步骤后，逐项检查：

### 功能性验收

- [ ] 能够成功上传 Excel 文件到云存储
- [ ] 订单数据导入成功（120 条）
- [ ] 核销记录导入成功（~108 条）
- [ ] 收银流水导入成功（~90 条）
- [ ] 能够查询导入状态和结果
- [ ] 错误处理正常（可故意上传错误格式文件测试）

### 数据质量验收

- [ ] orders 集合有 120 条数据
- [ ] verification_records 集合有 ~108 条数据
- [ ] cash_flow_records 集合有 ~90 条数据
- [ ] import_batches 集合有 3 条记录
- [ ] 所有日期格式为 YYYY-MM-DD HH:mm:ss
- [ ] 所有金额为数字类型，保留2位小数

### 性能验收

- [ ] 单个文件上传时间 < 10 秒
- [ ] 120 条数据导入时间 < 30 秒
- [ ] 无超时错误
- [ ] 云函数日志无异常

---

## 🎯 完成后进入 M2 阶段

M1 阶段验收通过后，可以开始 M2 阶段：

**M2 核心任务**：
1. 实现三方对账引擎（`run_reconciliation.ts`）
2. 实现 4 类差异检测算法
3. 实现差异查询接口
4. 实现对账概览统计

**参考文档**：待 M2 阶段开始时创建

---

## 🆘 遇到问题？

### 常见问题速查

| 问题 | 解决方案 | 参考文档 |
|------|---------|----------|
| 依赖安装失败 | 检查 package.json，重新上传 | TYPESCRIPT_COMPILE_NOTES.md |
| 文件上传失败 | 检查云存储是否开通 | M1_IMPLEMENTATION_GUIDE.md |
| Excel 解析失败 | 检查文件格式和编码 | EXCEL_TEMPLATES_GUIDE.md |
| 数据库插入失败 | 检查集合是否创建 | DATABASE_SETUP.md |
| TypeScript 报错 | 忽略本地错误，关注云端运行 | TYPESCRIPT_COMPILE_NOTES.md |

### 获取帮助

1. 查看云函数日志（抖音云控制台）
2. 查阅相关文档（见上文链接）
3. 检查抖音云官方文档

---

## 📞 联系与支持

如有问题，请查阅项目文档或联系项目负责人。

**文档版本**: V1.0  
**最后更新**: 2026-07-19

---

**祝您顺利完成任务！🎉**
