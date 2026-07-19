# 数据库集合创建指南

## 前置条件

1. 登录抖音云托管控制台
2. 进入您的小程序项目
3. 找到"云数据库"模块
4. 确保已开通云数据库服务

## 创建集合步骤

### 1. 创建 orders（团购订单）集合

**集合名称**: `orders`

**索引配置**:
- 主键: `_id` (系统自动生成)
- 唯一索引: `order_id` (订单号)
- 普通索引: `store_id`, `created_at`, `import_batch`

**字段说明**:
```typescript
{
  _id: string,              // 系统自动生成
  order_id: string,         // 订单号（唯一）
  store_id: string,         // 门店ID
  store_name: string,       // 门店名称
  product_name: string,     // 商品名称
  amount: number,           // 订单金额（元，保留2位小数）
  order_time: string,       // 下单时间（ISO 8601格式）
  status: string,           // 订单状态：completed/cancelled/refunded
  source: string,           // 数据来源：douyin/meituan/manual
  import_batch: string,     // 导入批次号
  created_at: Date          // 记录创建时间
}
```

---

### 2. 创建 verification_records（核销记录）集合

**集合名称**: `verification_records`

**索引配置**:
- 主键: `_id` (系统自动生成)
- 普通索引: `order_id`, `store_id`, `verify_time`, `import_batch`

**字段说明**:
```typescript
{
  _id: string,
  order_id: string,         // 关联订单号
  store_id: string,         // 门店ID
  verify_time: string,      // 核销时间（ISO 8601格式）
  verify_amount: number,    // 核销金额（元，保留2位小数）
  operator: string,         // 操作员姓名/ID
  source: string,           // 数据来源
  import_batch: string,     // 导入批次号
  created_at: Date          // 记录创建时间
}
```

---

### 3. 创建 cash_flow_records（收银流水）集合

**集合名称**: `cash_flow_records`

**索引配置**:
- 主键: `_id` (系统自动生成)
- 普通索引: `order_id`, `store_id`, `record_time`, `import_batch`

**字段说明**:
```typescript
{
  _id: string,
  order_id?: string,        // 可选，部分流水无订单号
  store_id: string,         // 门店ID
  amount: number,           // 收款金额（元，保留2位小数）
  record_time: string,      // 流水时间（ISO 8601格式）
  payment_method: string,   // 支付方式：wechat/alipay/cash/card
  remark: string,           // 备注信息
  source: string,           // 数据来源
  import_batch: string,     // 导入批次号
  created_at: Date          // 记录创建时间
}
```

---

### 4. 创建 discrepancy_records（差异记录）集合

**集合名称**: `discrepancy_records`

**索引配置**:
- 主键: `_id` (系统自动生成)
- 普通索引: `order_id`, `store_id`, `discrepancy_type`, `status`, `detected_time`

**字段说明**:
```typescript
{
  _id: string,
  order_id: string,         // 关联订单号
  store_id: string,         // 门店ID
  store_name: string,       // 门店名称
  discrepancy_type: string, // 差异类型
  // - MISSING_CASH_FLOW: 已核销但无流水
  // - MISSING_VERIFICATION: 有流水但未核销
  // - AMOUNT_MISMATCH: 金额不一致
  // - DUPLICATE_VERIFICATION: 重复核销
  expected_amount: number,  // 预期金额
  actual_amount: number,    // 实际金额
  difference: number,       // 差额（可正可负）
  detected_time: string,    // 检测时间（ISO 8601格式）
  status: string,           // 处理状态：pending/resolved/ignored
  suggestion: string,       // 处理建议
  created_at: Date          // 记录创建时间
}
```

---

### 5. 创建 import_batches（导入批次管理）集合

**集合名称**: `import_batches`

**索引配置**:
- 主键: `_id` (系统自动生成)
- 唯一索引: `batch_no` (批次号)
- 普通索引: `data_type`, `status`, `imported_at`

**字段说明**:
```typescript
{
  _id: string,
  batch_no: string,         // 批次号（唯一，格式：BATCH_YYYYMMDD_HHMMSS_XXX）
  data_type: string,        // 数据类型：orders/verification/cash_flow
  file_name: string,        // 原始文件名
  file_path: string,        // 云存储文件路径
  total_records: number,    // 总记录数
  success_records: number,  // 成功导入数
  failed_records: number,   // 失败记录数
  status: string,           // 状态：processing/completed/failed
  error_log: string[],      // 错误日志数组
  imported_by: string,      // 导入人open_id
  imported_at: Date         // 导入时间
}
```

---

## 验证集合创建

创建完成后，可以通过以下方式验证：

1. **在控制台查看**: 确认 5 个集合都已显示在集合列表中
2. **测试插入**: 使用云函数 `insert_record.ts` 向每个集合插入一条测试数据
3. **检查索引**: 确认索引配置正确（特别是唯一索引）

---

## 注意事项

⚠️ **重要提示**:
1. 集合名称一旦创建后无法修改，请仔细核对
2. 索引配置会影响查询性能，建议按上述配置创建
3. 抖音云数据库可能有集合数量限制，请确认配额
4. 建议在开发环境先测试，确认无误后再在生产环境创建

---

## 下一步

集合创建完成后，继续执行：
1. ✅ 设计 Excel 导入模板
2. ✅ 生成模拟测试数据
3. ✅ 开发数据导入云函数
