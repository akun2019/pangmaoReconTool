# 测试数据生成器使用说明

## 功能说明

本脚本用于生成覆盖 4 类差异场景的模拟测试数据，包括：
- ✅ 正常订单（60%）
- ⚠️ 已核销但无流水（30%）
- ⚠️ 金额不一致（20%，包含少收和多收）
- ⚠️ 重复核销（10%）
- ⚠️ 未核销（10%）

## 前置要求

确保已安装 Node.js（推荐 v16+）

## 安装依赖

```bash
cd scripts
npm install
```

## 生成数据

```bash
npm run generate
```

## 输出文件

生成的文件位于 `scripts/test_data/` 目录：

### Excel 格式
- `orders_test_data.xlsx` - 订单数据（120条）
- `verification_records_test_data.xlsx` - 核销记录
- `cash_flow_records_test_data.xlsx` - 收银流水

### CSV 格式（备选）
- `orders_test_data.csv`
- `verification_records_test_data.csv`
- `cash_flow_records_test_data.csv`

## 自定义配置

如需调整生成数据的参数，编辑 `generate_test_data.ts` 文件中的 `CONFIG` 对象：

```typescript
const CONFIG = {
  TOTAL_ORDERS: 120,        // 订单总数
  STORES: [...],            // 门店列表
  PRODUCTS: [...],          // 商品列表
  OUTPUT_DIR: './test_data' // 输出目录
};
```

## 注意事项

1. 每次运行会覆盖之前的文件，如需保留请提前备份
2. 生成的数据是随机的，每次运行结果不同
3. 数据时间范围：2026-07-01 至 2026-07-15
4. 所有金额单位为元，保留两位小数
