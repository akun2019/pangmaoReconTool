# 胖猫智能订单核销对账工具 - 项目总览

## 📌 项目信息

- **项目名称**: 胖猫智能订单核销对账工具
- **编制单位**: 湖北方舟智核科技有限公司
- **当前阶段**: M1 阶段（数据模型与基础采集）
- **技术架构**: 抖音云 + TypeScript + 云数据库
- **文档版本**: V1.0
- **更新日期**: 2026-07-19

---

## 🎯 项目目标

开发一个轻量化的对账工具，自动汇总团购订单、门店核销、收银流水三方数据，标记差异，替代人工对账。

**核心价值**: "数据对得上、差异看得懂"

---

## 📁 项目结构

```
pangmaoReconTool/
├── doc/                              # 项目文档
│   ├── DOC-001-项目立项书.md         # 原始立项文档
│   ├── DOC-002-系统设计文档.md       # 原始设计文档
│   ├── DATABASE_SETUP.md             # ✨ 数据库集合创建指南
│   ├── EXCEL_TEMPLATES_GUIDE.md      # ✨ Excel导入模板说明
│   └── M1_IMPLEMENTATION_GUIDE.md    # ✨ M1阶段实施指南
│
├── cloudfunctions/quickstart/        # 抖音云函数
│   ├── upload_file.ts                # ✨ 文件上传
│   ├── parse_and_import_orders.ts    # ✨ 订单数据导入
│   ├── parse_and_import_verifications.ts  # ✨ 核销记录导入
│   ├── parse_and_import_cashflows.ts # ✨ 收银流水导入
│   ├── get_import_status.ts          # ✨ 导入状态查询
│   ├── package.json                  # 依赖配置（已添加 xlsx）
│   └── ...其他原有文件
│
├── scripts/                          # 辅助脚本
│   ├── generate_test_data.ts         # ✨ 测试数据生成器
│   ├── package.json                  # 脚本依赖
│   └── README.md                     # 使用说明
│
├── pages/                            # 小程序页面（待开发）
│   ├── index/                        # 首页
│   ├── import/                       # ⏸️ 数据导入页（M1可选）
│   ├── dashboard/                    # ⏸️ 对账概览页（M3）
│   └── discrepancies/                # ⏸️ 差异清单页（M3）
│
└── templates/                        # Excel模板（待创建）
    ├── orders_template.xlsx          # ⏸️ 订单模板
    ├── verification_records_template.xlsx  # ⏸️ 核销模板
    └── cash_flow_records_template.xlsx     # ⏸️ 流水模板
```

**图例**:
- ✨ = M1 阶段已完成
- ⏸️ = 后续阶段开发

---

## ✅ M1 阶段完成清单

### 1. 文档体系（100%）

| 文档 | 状态 | 说明 |
|------|------|------|
| 数据库创建指南 | ✅ 完成 | 5个集合的字段定义和索引配置 |
| Excel模板说明 | ✅ 完成 | 3个模板的字段规范和示例 |
| M1实施指南 | ✅ 完成 | 完整的任务清单和测试步骤 |

### 2. 云函数开发（100%）

| 云函数 | 状态 | 功能 |
|--------|------|------|
| upload_file.ts | ✅ 完成 | 文件上传到云存储 |
| parse_and_import_orders.ts | ✅ 完成 | 订单数据解析导入 |
| parse_and_import_verifications.ts | ✅ 完成 | 核销记录解析导入 |
| parse_and_import_cashflows.ts | ✅ 完成 | 收银流水解析导入 |
| get_import_status.ts | ✅ 完成 | 导入进度查询 |

**核心功能**:
- ✅ Excel/CSV 文件解析（使用 xlsx 库）
- ✅ 数据清洗和验证
- ✅ 批量插入数据库（每批50条）
- ✅ 错误处理和日志记录
- ✅ 导入批次管理

### 3. 测试数据生成器（100%）

| 组件 | 状态 | 说明 |
|------|------|------|
| generate_test_data.ts | ✅ 完成 | TypeScript 数据生成脚本 |
| 模拟数据覆盖 | ✅ 完成 | 4类差异场景全覆盖 |
| 导出格式 | ✅ 完成 | Excel + CSV 双格式 |

**数据规模**:
- 订单: 120 条
- 核销记录: ~108 条（含重复核销）
- 收银流水: ~90 条（含散客消费）

**差异场景分布**:
- 正常订单: 60%
- 已核销但无流水: 30%
- 金额不一致: 20%
- 重复核销: 10%
- 未核销: 10%

---

## 📊 数据库设计

### 核心集合（5个）

#### 1. orders（团购订单）
```typescript
{
  _id: string,              // 主键
  order_id: string,         // 唯一索引
  store_id: string,         // 索引
  store_name: string,
  product_name: string,
  amount: number,
  order_time: string,       // ISO 8601
  status: string,
  source: string,
  import_batch: string,     // 索引
  created_at: Date
}
```

#### 2. verification_records（核销记录）
```typescript
{
  _id: string,
  order_id: string,         // 索引
  store_id: string,         // 索引
  verify_time: string,
  verify_amount: number,
  operator: string,
  source: string,
  import_batch: string,     // 索引
  created_at: Date
}
```

#### 3. cash_flow_records（收银流水）
```typescript
{
  _id: string,
  order_id?: string,        // 索引（可选）
  store_id: string,         // 索引
  amount: number,
  record_time: string,
  payment_method: string,
  remark: string,
  source: string,
  import_batch: string,     // 索引
  created_at: Date
}
```

#### 4. discrepancy_records（差异记录）- M2阶段使用
```typescript
{
  _id: string,
  order_id: string,
  store_id: string,
  store_name: string,
  discrepancy_type: string, // 索引
  expected_amount: number,
  actual_amount: number,
  difference: number,
  detected_time: string,
  status: string,           // 索引
  suggestion: string,
  created_at: Date
}
```

#### 5. import_batches（导入批次管理）
```typescript
{
  _id: string,
  batch_no: string,         // 唯一索引
  data_type: string,        // 索引
  file_name: string,
  file_path: string,
  total_records: number,
  success_records: number,
  failed_records: number,
  status: string,           // 索引
  error_log: string[],
  imported_by: string,
  imported_at: Date         // 索引
}
```

---

## 🔧 技术栈

### 后端（抖音云）
- **运行时**: Node.js + TypeScript
- **云数据库**: 抖音云托管 NoSQL 数据库
- **云存储**: 抖音云对象存储（TOS）
- **SDK**: `@open-dy/node-server-sdk`
- **Excel解析**: `xlsx` (v0.18.5)
- **日期处理**: `dayjs` (v1.11.10)

### 前端（抖音小程序）
- **框架**: 抖音小程序原生
- **语言**: TypeScript
- **UI**: 原生组件（待开发）

### 开发工具
- **数据生成**: Node.js + TypeScript
- **包管理**: npm
- **代码编辑器**: VS Code

---

## 📅 开发计划

### M1 阶段（当前）- 数据模型与基础采集

**时间**: 第 1 周  
**状态**: 🟢 开发完成，待部署测试

**交付物**:
- ✅ 数据库设计文档
- ✅ Excel 导入模板规范
- ✅ 5 个云函数
- ✅ 测试数据生成器
- ⏸️ 数据库集合（需手动创建）
- ⏸️ 云函数部署（需手动部署）
- ⏸️ 前端导入页面（可选）

**验收标准**:
- [ ] 能够上传并解析 Excel 文件
- [ ] 成功导入至少 100 条订单数据
- [ ] 数据清洗和验证逻辑正确
- [ ] 错误处理机制完善

---

### M2 阶段 - 比对引擎开发

**时间**: 第 2 周  
**状态**: ⚪ 未开始

**计划任务**:
- [ ] 实现 run_reconciliation.ts（对账引擎）
- [ ] 实现 4 类差异检测算法
- [ ] 实现 get_discrepancy_list.ts（差异查询）
- [ ] 实现 get_reconciliation_summary.ts（概览统计）
- [ ] 单元测试和性能优化

**核心算法**:
```typescript
// 差异类型
enum DiscrepancyType {
  MISSING_CASH_FLOW,         // 已核销但无流水
  MISSING_VERIFICATION,      // 有流水但未核销
  AMOUNT_MISMATCH,           // 金额不一致
  DUPLICATE_VERIFICATION     // 重复核销
}
```

---

### M3 阶段 - 可视化与 Demo

**时间**: 第 2-3 周  
**状态**: ⚪ 未开始

**计划任务**:
- [ ] 实现 dashboard 页面（对账概览）
- [ ] 实现 discrepancies 页面（差异清单）
- [ ] 实现筛选和排序功能
- [ ] 实现 export_report.ts（报表导出）
- [ ] UI 优化和演示脚本制作

---

### M4 阶段 - 真实 API 接入评估

**时间**: Demo 完成后  
**状态**: ⚪ 待定

**前置条件**: 抖音开放平台接口信息补齐

**计划任务**:
- [ ] 核实 client_token 换取接口
- [ ] 核实团购订单查询接口
- [ ] 核实核销记录查询接口
- [ ] 实现自动拉取云函数
- [ ] 实现增量同步逻辑

---

## 🚀 快速开始

### 1. 创建数据库集合

参考文档: `doc/DATABASE_SETUP.md`

在抖音云控制台创建 5 个集合并配置索引。

### 2. 部署云函数

参考文档: `doc/M1_IMPLEMENTATION_GUIDE.md` - 任务 2

上传 `cloudfunctions/quickstart` 目录并配置路由。

### 3. 生成测试数据

```bash
cd scripts
npm install
npm run generate
```

输出文件位于 `scripts/test_data/`

### 4. 测试导入流程

参考文档: `doc/M1_IMPLEMENTATION_GUIDE.md` - 任务 4

依次测试：
1. 上传文件 → upload_file.ts
2. 解析导入 → parse_and_import_*.ts
3. 查询状态 → get_import_status.ts

---

## 📝 重要说明

### 技术方案选择

✅ **采用方案 A**: 使用 TypeScript 在抖音云函数中实现所有逻辑

**优势**:
- 减少系统复杂度
- 利用抖音云免运维优势
- 降低开发和运维成本
- Node.js 完全胜任数据处理任务

### 数据接入策略

📌 **第一阶段（MVP）**: 完全基于文件导入

- 不依赖任何实时 API
- 支持 Excel/CSV 格式
- 重点验证数据清洗和比对算法
- 为后续自动化预留扩展空间

### 模拟数据使用

⚠️ **对外展示要求**:

根据项目立项书第 6 节红线要求：
- 使用模拟数据或测试商家数据时，必须如实说明
- 不得包装为"已服务真实商家的正式案例"
- 建议统一使用虚拟连锁商家背景故事

---

## 🔍 质量保证

### 代码质量
- ✅ TypeScript 严格模式
- ✅ 完整的错误处理
- ✅ 详细的注释文档
- ✅ 统一的代码风格

### 数据安全
- ✅ 数据脱敏（模拟数据）
- ✅ 权限控制（抖音云内置）
- ✅ 传输加密（HTTPS）
- ⏸️ 访问日志（待实现）

### 性能优化
- ✅ 批量插入（每批 50 条）
- ✅ 异步并行处理
- ✅ 合理的索引设计
- ⏸️ 缓存机制（待评估）

---

## 📞 支持与反馈

### 文档资源
- 项目立项书: `doc/DOC-001-项目立项书.md`
- 系统设计文档: `doc/DOC-002-系统设计文档.md`
- M1 实施指南: `doc/M1_IMPLEMENTATION_GUIDE.md`

### 问题排查
1. 查看云函数日志（抖音云控制台）
2. 检查数据库集合配置
3. 参考实施指南的常见问题章节
4. 查阅抖音云官方文档

---

## 📈 下一步行动

**立即执行**（本周内）:
1. [ ] 在抖音云平台创建 5 个数据库集合
2. [ ] 部署 5 个云函数并测试
3. [ ] 生成模拟测试数据
4. [ ] 完成端到端导入测试
5. [ ] （可选）开发前端导入页面

**下周计划**（M2 阶段）:
1. [ ] 设计对账引擎算法
2. [ ] 实现差异检测逻辑
3. [ ] 编写单元测试
4. [ ] 性能优化和调优

---

## 📄 版本历史

| 版本 | 日期 | 更新内容 | 作者 |
|------|------|----------|------|
| V1.0 | 2026-07-19 | M1 阶段完成，创建核心文档和云函数 | AI Assistant |

---

**项目状态**: 🟢 M1 阶段开发完成，待部署测试  
**下次更新**: M2 阶段开始时
