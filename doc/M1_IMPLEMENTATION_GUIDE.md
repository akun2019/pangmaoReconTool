# M1 阶段实施指南

## 阶段目标

完成数据模型设计与数据接入功能，实现 Excel/CSV 文件的上传、解析和入库。

**预计完成时间**: 立项后 1 周

---

## 已完成工作清单

### ✅ 1. 数据库设计文档

已创建 `doc/DATABASE_SETUP.md`，包含：
- 5 个核心集合的字段定义
- 索引配置建议
- 创建步骤说明

### ✅ 2. Excel 导入模板设计

已创建 `doc/EXCEL_TEMPLATES_GUIDE.md`，包含：
- 3 个标准模板的字段规范
- 数据格式要求
- 常见错误及解决方案
- 示例数据

### ✅ 3. 模拟测试数据生成器

已创建 `scripts/generate_test_data.ts`，功能包括：
- 生成 120 条订单数据
- 覆盖 4 类差异场景
- 导出为 Excel 和 CSV 格式
- 自动生成统计报告

### ✅ 4. 云函数开发（M1 核心）

已创建以下云函数：

#### 文件管理
- ✅ `upload_file.ts` - 文件上传到云存储

#### 数据导入
- ✅ `parse_and_import_orders.ts` - 订单数据解析导入
- ✅ `parse_and_import_verifications.ts` - 核销记录解析导入
- ✅ `parse_and_import_cashflows.ts` - 收银流水解析导入

#### 状态查询
- ✅ `get_import_status.ts` - 查询导入进度和结果

---

## 待执行任务清单

### 📋 任务 1：在抖音云平台创建数据库集合

**操作步骤**：

1. 登录 [抖音云托管控制台](https://cloud.douyin.com/)
2. 进入您的小程序项目
3. 找到"云数据库"模块
4. 按照 `doc/DATABASE_SETUP.md` 中的说明，依次创建 5 个集合：
   - `orders`
   - `verification_records`
   - `cash_flow_records`
   - `discrepancy_records`
   - `import_batches`

5. 配置索引（重要！）：
   - `orders.order_id` - 唯一索引
   - `import_batches.batch_no` - 唯一索引
   - 其他普通索引按需配置

**验证方法**：
```typescript
// 使用现有的 insert_record.ts 测试插入
// 或使用新创建的云函数进行导入测试
```

---

### 📋 任务 2：部署云函数

**操作步骤**：

1. 在抖音云托管控制台创建云函数服务
2. 选择 TypeScript 运行时
3. 上传 `cloudfunctions/quickstart` 目录的代码
4. 安装依赖（确保包含 `xlsx` 库）
5. 配置云函数路由：

| HTTP 方法 | 路径 | 对应文件 |
|-----------|------|----------|
| POST | /upload_file | upload_file.ts |
| POST | /parse_and_import_orders | parse_and_import_orders.ts |
| POST | /parse_and_import_verifications | parse_and_import_verifications.ts |
| POST | /parse_and_import_cashflows | parse_and_import_cashflows.ts |
| GET | /get_import_status | get_import_status.ts |

6. 测试每个云函数的可用性

---

### 📋 任务 3：生成模拟测试数据

**操作步骤**：

```bash
# 进入脚本目录
cd scripts

# 安装依赖
npm install

# 生成测试数据
npm run generate
```

**输出文件**：
```
scripts/test_data/
├── orders_test_data.xlsx              # 120 条订单
├── verification_records_test_data.xlsx # 约 108 条核销记录
├── cash_flow_records_test_data.xlsx    # 约 90 条流水记录
└── *.csv                               # CSV 格式备份
```

**验证数据质量**：
- 打开 Excel 文件检查数据格式
- 确认包含 4 类差异场景
- 检查日期、金额格式是否正确

---

### 📋 任务 4：测试数据导入流程

**测试步骤**：

#### 测试 1：上传订单数据

```javascript
// 调用 upload_file.ts
POST /upload_file
{
  "fileName": "orders_test_data.xlsx",
  "fileContent": "<base64编码的文件内容>",
  "dataType": "orders"
}

// 预期响应
{
  "code": 0,
  "message": "文件上传成功",
  "data": {
    "fileId": "cloud://xxx/orders/BATCH_xxx/orders_test_data.xlsx",
    "batchNo": "BATCH_20260711_143000_123"
  }
}
```

#### 测试 2：导入订单数据

```javascript
// 调用 parse_and_import_orders.ts
POST /parse_and_import_orders
{
  "batchNo": "BATCH_20260711_143000_123",
  "fileId": "cloud://xxx/orders/BATCH_xxx/orders_test_data.xlsx"
}

// 预期响应
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

#### 测试 3：查询导入状态

```javascript
// 调用 get_import_status.ts
GET /get_import_status?batchNo=BATCH_20260711_143000_123

// 预期响应
{
  "code": 0,
  "message": "查询成功",
  "data": {
    "batch_no": "BATCH_20260711_143000_123",
    "data_type": "orders",
    "status": "completed",
    "total_records": 120,
    "success_records": 120,
    "failed_records": 0
  }
}
```

#### 测试 4：重复测试核销和流水

按相同流程测试：
- `parse_and_import_verifications.ts`
- `parse_and_import_cashflows.ts`

---

### 📋 任务 5：前端页面开发（可选，M1 可先不做）

如果需要在 M1 阶段提供可视化界面，需要创建以下页面：

#### 页面 1：数据导入页

**路径**: `pages/import/import`

**功能**：
- 三个导入入口（订单/核销/流水）
- 文件选择器
- 上传进度显示
- 导入结果展示

**关键代码片段**：

```typescript
// pages/import/import.ts
Page({
  data: {
    dataType: 'orders', // orders | verification | cash_flow
    uploading: false,
    importStatus: null
  },
  
  // 选择文件
  chooseFile() {
    tt.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0];
        this.uploadFile(file);
      }
    });
  },
  
  // 上传文件
  async uploadFile(file) {
    this.setData({ uploading: true });
    
    // 读取文件内容为 base64
    const fileContent = await this.readFileAsBase64(file.path);
    
    // 调用上传云函数
    const uploadResult = await tt.cloud.callContainer({
      path: '/upload_file',
      method: 'POST',
      data: {
        fileName: file.name,
        fileContent: fileContent,
        dataType: this.data.dataType
      }
    });
    
    if (uploadResult.data.code === 0) {
      // 开始解析导入
      await this.importData(uploadResult.data.data.batchNo, uploadResult.data.data.fileId);
    }
  },
  
  // 导入数据
  async importData(batchNo, fileId) {
    let importFunction;
    switch (this.data.dataType) {
      case 'orders':
        importFunction = '/parse_and_import_orders';
        break;
      case 'verification':
        importFunction = '/parse_and_import_verifications';
        break;
      case 'cash_flow':
        importFunction = '/parse_and_import_cashflows';
        break;
    }
    
    const result = await tt.cloud.callContainer({
      path: importFunction,
      method: 'POST',
      data: { batchNo, fileId }
    });
    
    this.setData({ 
      uploading: false,
      importStatus: result.data
    });
  }
});
```

---

## M1 验收标准

### 功能性验收

- [ ] 能够成功上传 Excel/CSV 文件到云存储
- [ ] 能够正确解析三种数据类型（订单/核销/流水）
- [ ] 数据清洗和验证逻辑正常工作
- [ ] 批量导入数据库成功（至少 100 条数据）
- [ ] 能够查询导入状态和结果
- [ ] 错误处理机制完善（文件格式错误、字段缺失等）

### 数据质量验收

- [ ] 导入的订单数据至少 100 条
- [ ] 导入的核销记录至少 80 条
- [ ] 导入的流水记录至少 70 条
- [ ] 数据格式统一（日期、金额、字符串）
- [ ] 无重复数据（基于 order_id）

### 性能验收

- [ ] 单个文件上传时间 < 10 秒
- [ ] 100 条数据解析导入时间 < 30 秒
- [ ] 云函数无超时错误

---

## 常见问题排查

### 问题 1：云函数依赖安装失败

**现象**: 部署时提示 `xlsx module not found`

**解决方案**:
```bash
# 在 cloudfunctions/quickstart 目录下
npm install xlsx@0.18.5

# 重新打包上传
```

---

### 问题 2：文件上传失败

**现象**: 返回 `file upload failed`

**排查步骤**:
1. 检查云存储是否已开通
2. 检查文件路径权限
3. 检查文件大小（抖音云可能有大小限制）
4. 查看云函数日志获取详细错误信息

---

### 问题 3：Excel 解析失败

**现象**: 返回 `parse error` 或数据为空

**排查步骤**:
1. 用 Excel 打开文件，检查是否有损坏
2. 确认第一行是表头（字段名）
3. 确认编码格式（CSV 必须是 UTF-8）
4. 尝试用生成的测试数据文件测试

---

### 问题 4：数据库插入失败

**现象**: 返回 `database insert failed`

**排查步骤**:
1. 确认云数据库已开通
2. 确认集合已创建且名称正确
3. 检查字段类型是否匹配
4. 检查是否有唯一索引冲突（order_id 重复）

---

## 下一步计划

M1 阶段完成后，进入 **M2 阶段**：比对引擎开发

**M2 主要任务**:
1. 实现三方对账核心逻辑（`run_reconciliation.ts`）
2. 实现差异检测算法（4 类差异）
3. 实现差异结果查询接口
4. 实现对账概览统计接口

**预计时间**: 第 2 周

---

## 联系与支持

如在实施过程中遇到问题：
1. 查看云函数日志（抖音云控制台）
2. 检查数据库集合配置
3. 参考本文档的常见问题章节
4. 查阅抖音云官方文档

---

**文档版本**: V1.0  
**最后更新**: 2026-07-19
