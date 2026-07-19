# M2 阶段开发计划 - 对账引擎

## 📅 计划时间
第 2 周（M1 完成后立即开始）

---

## 🎯 M2 阶段目标

实现三方对账核心逻辑，自动检测并标记 4 类差异场景。

**核心功能**:
1. ✅ 订单-核销-流水三方比对算法
2. ✅ 4 类差异检测（已核销但无流水、有流水但未核销、金额不一致、重复核销）
3. ✅ 差异结果存储到 discrepancy_records 集合
4. ✅ 差异查询接口
5. ✅ 对账概览统计接口

---

## 📋 任务清单

### 任务 1: 实现对账引擎核心算法

**文件**: `cloudfunctions/quickstart/run_reconciliation.ts`

**功能**:
- 从数据库读取订单、核销、流水数据
- 按订单号进行三方关联匹配
- 执行 4 类差异检测
- 将差异结果写入 discrepancy_records 集合
- 返回对账统计报告

**预计代码量**: ~400 行

**核心算法伪代码**:
```typescript
// 1. 读取数据
const orders = await getOrdersByDateRange(startDate, endDate);
const verifications = await getVerificationsByDateRange(startDate, endDate);
const cashFlows = await getCashFlowsByDateRange(startDate, endDate);

// 2. 构建索引
const verificationMap = groupBy(verifications, 'order_id');
const cashFlowMap = groupBy(cashFlows, 'order_id');

// 3. 遍历订单，检测差异
for (const order of orders) {
  const relatedVerifications = verificationMap[order.order_id] || [];
  const relatedCashFlows = cashFlowMap[order.order_id] || [];
  
  // 检测规则 1: 已核销但无流水
  if (relatedVerifications.length > 0 && relatedCashFlows.length === 0) {
    createDiscrepancy('MISSING_CASH_FLOW', ...);
  }
  
  // 检测规则 2: 有流水但未核销
  if (relatedVerifications.length === 0 && relatedCashFlows.length > 0) {
    createDiscrepancy('MISSING_VERIFICATION', ...);
  }
  
  // 检测规则 3: 金额不一致
  for (const verification of relatedVerifications) {
    if (Math.abs(order.amount - verification.verify_amount) > 0.01) {
      createDiscrepancy('AMOUNT_MISMATCH', ...);
    }
  }
  
  // 检测规则 4: 重复核销
  if (relatedVerifications.length > 1) {
    createDiscrepancy('DUPLICATE_VERIFICATION', ...);
  }
}

// 4. 保存差异记录
await saveDiscrepancies(discrepancies);
```

---

### 任务 2: 实现差异查询接口

**文件**: `cloudfunctions/quickstart/get_discrepancy_list.ts`

**功能**:
- 支持按差异类型筛选
- 支持按门店筛选
- 支持按时间范围筛选
- 支持分页查询
- 支持排序（按时间、按金额等）

**请求参数**:
```json
{
  "discrepancyType": "MISSING_CASH_FLOW",  // 可选
  "storeId": "STORE_001",                   // 可选
  "startDate": "2026-07-01",                // 可选
  "endDate": "2026-07-15",                  // 可选
  "page": 1,                                // 可选，默认1
  "pageSize": 20,                           // 可选，默认20
  "sortBy": "detected_time",                // 可选
  "sortOrder": "desc"                       // 可选，asc/desc
}
```

**预计代码量**: ~150 行

---

### 任务 3: 实现对账概览统计接口

**文件**: `cloudfunctions/quickstart/get_reconciliation_summary.ts`

**功能**:
- 统计指定时间范围内的对账数据
- 计算各类差异的数量和金额
- 提供可视化所需的数据结构

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "dateRange": {
      "startDate": "2026-07-01",
      "endDate": "2026-07-15"
    },
    "summary": {
      "totalOrders": 328,
      "verifiedOrders": 302,
      "unverifiedOrders": 26,
      "totalDiscrepancies": 45
    },
    "discrepancyBreakdown": {
      "MISSING_CASH_FLOW": {
        "count": 15,
        "totalAmount": 2985.00
      },
      "MISSING_VERIFICATION": {
        "count": 10,
        "totalAmount": 1590.00
      },
      "AMOUNT_MISMATCH": {
        "count": 12,
        "totalAmount": 450.50
      },
      "DUPLICATE_VERIFICATION": {
        "count": 8,
        "totalAmount": 1592.00
      }
    },
    "storeBreakdown": [
      {
        "storeId": "STORE_001",
        "storeName": "北京朝阳店",
        "discrepancyCount": 20,
        "totalAmount": 3500.00
      }
    ]
  }
}
```

**预计代码量**: ~200 行

---

### 任务 4: 实现报表导出接口

**文件**: `cloudfunctions/quickstart/export_report.ts`

**功能**:
- 生成 Excel 格式的对账报表
- 包含差异清单明细
- 包含统计汇总
- 上传到云存储并返回下载链接

**预计代码量**: ~180 行

---

### 任务 5: 编写单元测试

**文件**: 
- `cloudfunctions/quickstart/reconciliation.test.ts`

**测试用例**:
- 正常订单不产生差异
- 已核销但无流水场景检测
- 有流水但未核销场景检测
- 金额不一致场景检测
- 重复核销场景检测
- 边界条件测试（空数据、大数据量等）

**预计代码量**: ~300 行

---

## 🏗️ 技术设计

### 1. 差异类型枚举

```typescript
enum DiscrepancyType {
  MISSING_CASH_FLOW = 'MISSING_CASH_FLOW',           // 已核销但无流水
  MISSING_VERIFICATION = 'MISSING_VERIFICATION',     // 有流水但未核销
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',               // 金额不一致
  DUPLICATE_VERIFICATION = 'DUPLICATE_VERIFICATION'  // 重复核销
}
```

### 2. 差异记录结构

```typescript
interface DiscrepancyRecord {
  _id: string;
  order_id: string;
  store_id: string;
  store_name: string;
  discrepancy_type: DiscrepancyType;
  expected_amount: number;      // 预期金额
  actual_amount: number;        // 实际金额
  difference: number;           // 差额
  detected_time: string;        // 检测时间
  status: 'pending' | 'resolved' | 'ignored';
  suggestion: string;           // 处理建议
  created_at: Date;
}
```

### 3. 对账策略

#### 精确匹配（优先级 1）
```typescript
if (order.order_id === verification.order_id) {
  return MATCH_EXACT;
}
```

#### 模糊匹配（优先级 2，M2 可选）
```typescript
if (
  Math.abs(order.amount - verification.verify_amount) < 0.01 &&
  order.store_id === verification.store_id &&
  timeDiff(order.order_time, verification.verify_time) < 24h
) {
  return MATCH_FUZZY;
}
```

**M2 阶段先实现精确匹配，模糊匹配可留待后续优化。**

---

## 📊 性能考虑

### 1. 数据量预估
- MVP 阶段：每次对账约 100-500 条订单
- 生产环境：可能达到 1000-5000 条订单

### 2. 优化策略
- 使用数据库聚合查询减少数据传输
- 分批处理（每批 100 条订单）
- 建立合适的索引（order_id, store_id, created_at）
- 缓存常用统计数据

### 3. 超时控制
- 抖音云函数超时时间：30 秒
- 需要确保在超时前完成对账
- 如数据量过大，考虑异步任务队列

---

## 🧪 测试策略

### 1. 单元测试
- 测试每个差异检测规则
- 测试边界条件
- 测试异常情况

### 2. 集成测试
- 使用 M1 生成的测试数据
- 验证差异检测结果正确性
- 验证差异数量符合预期

### 3. 性能测试
- 大数据量测试（1000+ 条订单）
- 并发测试
- 内存使用情况监控

---

## ⏱️ 时间估算

| 任务 | 预计耗时 | 优先级 |
|------|---------|--------|
| 任务 1: 对账引擎核心算法 | 1.5 天 | P0 |
| 任务 2: 差异查询接口 | 0.5 天 | P0 |
| 任务 3: 对账概览统计 | 0.5 天 | P0 |
| 任务 4: 报表导出 | 0.5 天 | P1 |
| 任务 5: 单元测试 | 1 天 | P0 |
| **总计** | **4 天** | - |

---

## 📝 交付物

### 云函数（4个）
1. `run_reconciliation.ts` - 对账引擎
2. `get_discrepancy_list.ts` - 差异查询
3. `get_reconciliation_summary.ts` - 概览统计
4. `export_report.ts` - 报表导出

### 测试文件（1个）
1. `reconciliation.test.ts` - 单元测试

### 文档（1个）
1. `doc/M2_IMPLEMENTATION_GUIDE.md` - M2 实施指南

---

## ✅ 验收标准

### 功能性验收
- [ ] 能够正确检测 4 类差异
- [ ] 差异记录准确无误
- [ ] 查询接口返回正确数据
- [ ] 统计接口数据准确
- [ ] 报表导出功能正常

### 准确性验收
使用 M1 生成的测试数据验证：
- [ ] MISSING_CASH_FLOW: 检测到 ~36 条
- [ ] MISSING_VERIFICATION: 检测到 ~12 条
- [ ] AMOUNT_MISMATCH: 检测到 ~24 条
- [ ] DUPLICATE_VERIFICATION: 检测到 ~12 条

### 性能验收
- [ ] 100 条订单对账时间 < 10 秒
- [ ] 500 条订单对账时间 < 30 秒
- [ ] 无内存泄漏
- [ ] 无超时错误

---

## 🚀 下一步

M2 阶段完成后，进入 **M3 阶段**：可视化与 Demo

**M3 主要任务**:
1. 开发前端页面（dashboard, discrepancies, report）
2. 实现筛选和排序功能
3. UI 优化
4. 制作演示脚本

---

**文档版本**: V1.0  
**编制日期**: 2026-07-19  
**状态**: 待执行
