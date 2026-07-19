/**
 * 模拟测试数据生成器
 * 
 * 功能：生成覆盖 4 类差异场景的测试数据
 * - 已核销但无流水（MISSING_CASH_FLOW）
 * - 有流水但未核销（MISSING_VERIFICATION）
 * - 金额不一致（AMOUNT_MISMATCH）
 * - 重复核销（DUPLICATE_VERIFICATION）
 * 
 * 使用方法：
 * npm install xlsx
 * npx ts-node generate_test_data.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// ==================== 配置区 ====================

const CONFIG = {
  // 生成的订单总数
  TOTAL_ORDERS: 120,
  
  // 门店列表
  STORES: [
    { id: 'STORE_001', name: '北京朝阳店' },
    { id: 'STORE_002', name: '上海浦东店' },
    { id: 'STORE_003', name: '广州天河店' },
    { id: 'STORE_004', name: '深圳南山店' },
    { id: 'STORE_005', name: '成都武侯店' }
  ],
  
  // 商品列表
  PRODUCTS: [
    { name: '双人套餐A', price: 199.00 },
    { name: '单人午餐', price: 59.90 },
    { name: '家庭套餐', price: 299.00 },
    { name: '下午茶套餐', price: 88.00 },
    { name: '商务套餐', price: 128.00 },
    { name: '情侣套餐', price: 258.00 },
    { name: '儿童套餐', price: 79.00 },
    { name: 'VIP尊享套餐', price: 399.00 }
  ],
  
  // 支付方式
  PAYMENT_METHODS: ['wechat', 'alipay', 'cash', 'card'],
  
  // 输出目录
  OUTPUT_DIR: './test_data'
};

// ==================== 工具函数 ====================

/**
 * 生成随机整数
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机浮点数（保留2位小数）
 */
function randomFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

/**
 * 从数组中随机选择一个元素
 */
function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

/**
 * 生成指定格式的日期字符串
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 生成随机日期（在指定范围内）
 */
function randomDate(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = randomInt(startTime, endTime);
  return new Date(randomTime);
}

/**
 * 生成订单号
 */
function generateOrderId(index: number, date: Date): string {
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `DY${dateStr}${String(index).padStart(4, '0')}`;
}

/**
 * 生成批次号
 */
function generateBatchNo(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const random = String(randomInt(100, 999));
  return `BATCH_${timestamp}_${random}`;
}

// ==================== 数据生成逻辑 ====================

interface Order {
  order_id: string;
  store_id: string;
  store_name: string;
  product_name: string;
  amount: number;
  order_time: string;
  status: string;
  source: string;
}

interface VerificationRecord {
  order_id: string;
  store_id: string;
  verify_time: string;
  verify_amount: number;
  operator: string;
  source: string;
}

interface CashFlowRecord {
  order_id?: string;
  store_id: string;
  amount: number;
  record_time: string;
  payment_method: string;
  remark: string;
  source: string;
}

/**
 * 生成基础订单数据
 */
function generateOrders(): Order[] {
  const orders: Order[] = [];
  const startDate = new Date('2026-07-01');
  const endDate = new Date('2026-07-15');
  
  for (let i = 1; i <= CONFIG.TOTAL_ORDERS; i++) {
    const store = randomChoice(CONFIG.STORES);
    const product = randomChoice(CONFIG.PRODUCTS);
    const orderDate = randomDate(startDate, endDate);
    
    // 将下单时间设置在营业时间范围内（10:00-22:00）
    orderDate.setHours(randomInt(10, 21));
    orderDate.setMinutes(randomInt(0, 59));
    orderDate.setSeconds(randomInt(0, 59));
    
    orders.push({
      order_id: generateOrderId(i, orderDate),
      store_id: store.id,
      store_name: store.name,
      product_name: product.name,
      amount: product.price,
      order_time: formatDate(orderDate),
      status: 'completed',
      source: randomChoice(['douyin', 'meituan', 'manual'])
    });
  }
  
  return orders;
}

/**
 * 生成核销记录（包含差异场景）
 */
function generateVerifications(orders: Order[]): VerificationRecord[] {
  const verifications: VerificationRecord[] = [];
  const operators = ['张三', '李四', '王五', '赵六', '钱七'];
  
  orders.forEach((order, index) => {
    const scenario = index % 10; // 每10个订单一个循环，覆盖不同场景
    
    if (scenario < 6) {
      // 场景1-6：正常核销（60%）
      const verifyTime = new Date(order.order_time);
      verifyTime.setHours(verifyTime.getHours() + randomInt(2, 8)); // 核销时间在下单后2-8小时
      
      verifications.push({
        order_id: order.order_id,
        store_id: order.store_id,
        verify_time: formatDate(verifyTime),
        verify_amount: order.amount,
        operator: randomChoice(operators),
        source: order.source
      });
    } else if (scenario === 6) {
      // 场景7：金额不一致 - 少收（10%）
      const verifyTime = new Date(order.order_time);
      verifyTime.setHours(verifyTime.getHours() + randomInt(2, 8));
      
      verifications.push({
        order_id: order.order_id,
        store_id: order.store_id,
        verify_time: formatDate(verifyTime),
        verify_amount: parseFloat((order.amount * 0.8).toFixed(2)), // 只收了80%
        operator: randomChoice(operators),
        source: order.source
      });
    } else if (scenario === 7) {
      // 场景8：金额不一致 - 多收（10%）
      const verifyTime = new Date(order.order_time);
      verifyTime.setHours(verifyTime.getHours() + randomInt(2, 8));
      
      verifications.push({
        order_id: order.order_id,
        store_id: order.store_id,
        verify_time: formatDate(verifyTime),
        verify_amount: parseFloat((order.amount * 1.1).toFixed(2)), // 收了110%
        operator: randomChoice(operators),
        source: order.source
      });
    } else if (scenario === 8) {
      // 场景9：重复核销（10%）
      const verifyTime1 = new Date(order.order_time);
      verifyTime1.setHours(verifyTime1.getHours() + randomInt(2, 4));
      
      const verifyTime2 = new Date(order.order_time);
      verifyTime2.setHours(verifyTime2.getHours() + randomInt(5, 8));
      
      // 第一次核销
      verifications.push({
        order_id: order.order_id,
        store_id: order.store_id,
        verify_time: formatDate(verifyTime1),
        verify_amount: order.amount,
        operator: randomChoice(operators),
        source: order.source
      });
      
      // 第二次核销（重复）
      verifications.push({
        order_id: order.order_id,
        store_id: order.store_id,
        verify_time: formatDate(verifyTime2),
        verify_amount: order.amount,
        operator: randomChoice(operators),
        source: order.source
      });
    }
    // 场景10：未核销（10%）- 不生成核销记录
  });
  
  return verifications;
}

/**
 * 生成收银流水（包含差异场景）
 */
function generateCashFlows(orders: Order[], verifications: VerificationRecord[]): CashFlowRecord[] {
  const cashFlows: CashFlowRecord[] = [];
  
  // 为每个核销记录生成对应的流水
  verifications.forEach((verification, index) => {
    const scenario = index % 10;
    
    if (scenario < 7) {
      // 场景1-7：正常流水（70%）
      const recordTime = new Date(verification.verify_time);
      recordTime.setMinutes(recordTime.getMinutes() + randomInt(1, 10)); // 流水时间在核销后1-10分钟
      
      cashFlows.push({
        order_id: verification.order_id,
        store_id: verification.store_id,
        amount: verification.verify_amount,
        record_time: formatDate(recordTime),
        payment_method: randomChoice(CONFIG.PAYMENT_METHODS),
        remark: '团购核销',
        source: 'pos_system'
      });
    }
    // 场景8-10：无流水（30%）- 不生成流水记录，形成"已核销但无流水"差异
  });
  
  // 额外添加一些无订单号的流水（散客消费）
  const startDate = new Date('2026-07-01');
  const endDate = new Date('2026-07-15');
  
  for (let i = 0; i < 15; i++) {
    const store = randomChoice(CONFIG.STORES);
    const recordDate = randomDate(startDate, endDate);
    recordDate.setHours(randomInt(10, 21));
    
    cashFlows.push({
      store_id: store.id,
      amount: randomFloat(30, 300),
      record_time: formatDate(recordDate),
      payment_method: randomChoice(CONFIG.PAYMENT_METHODS),
      remark: '散客消费',
      source: 'pos_system'
    });
  }
  
  return cashFlows;
}

// ==================== Excel 导出函数 ====================

/**
 * 导出数据到 Excel 文件
 */
function exportToExcel(data: any[], filename: string, sheetName: string): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  const outputPath = path.join(CONFIG.OUTPUT_DIR, filename);
  XLSX.writeFile(wb, outputPath);
  console.log(`✅ 文件已生成: ${outputPath}`);
}

/**
 * 导出数据到 CSV 文件
 */
function exportToCSV(data: any[], filename: string): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  const outputPath = path.join(CONFIG.OUTPUT_DIR, filename);
  fs.writeFileSync(outputPath, '\ufeff' + csv, 'utf-8'); // 添加 BOM 头，支持 Excel 正确显示中文
  console.log(`✅ 文件已生成: ${outputPath}`);
}

// ==================== 主函数 ====================

async function main(): Promise<void> {
  console.log('🚀 开始生成模拟测试数据...\n');
  
  // 创建输出目录
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
  }
  
  // 1. 生成订单数据
  console.log('📦 生成订单数据...');
  const orders = generateOrders();
  console.log(`   ✓ 生成 ${orders.length} 条订单\n`);
  
  // 2. 生成核销记录
  console.log('✓ 生成核销记录...');
  const verifications = generateVerifications(orders);
  console.log(`   ✓ 生成 ${verifications.length} 条核销记录\n`);
  
  // 3. 生成收银流水
  console.log('✓ 生成收银流水...');
  const cashFlows = generateCashFlows(orders, verifications);
  console.log(`   ✓ 生成 ${cashFlows.length} 条流水记录\n`);
  
  // 4. 导出为 Excel 格式
  console.log('💾 导出 Excel 文件...');
  exportToExcel(orders, 'orders_test_data.xlsx', '订单数据');
  exportToExcel(verifications, 'verification_records_test_data.xlsx', '核销记录');
  exportToExcel(cashFlows, 'cash_flow_records_test_data.xlsx', '收银流水');
  
  // 5. 同时导出 CSV 格式（备选）
  console.log('\n💾 导出 CSV 文件...');
  exportToCSV(orders, 'orders_test_data.csv');
  exportToCSV(verifications, 'verification_records_test_data.csv');
  exportToCSV(cashFlows, 'cash_flow_records_test_data.csv');
  
  // 6. 生成数据统计报告
  console.log('\n📊 数据统计报告:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`订单总数: ${orders.length}`);
  console.log(`核销记录数: ${verifications.length}`);
  console.log(`收银流水数: ${cashFlows.length}`);
  
  // 计算预期差异数量
  const normalCount = Math.floor(orders.length * 0.6); // 60% 正常
  const missingCashFlowCount = Math.floor(orders.length * 0.3); // 30% 已核销但无流水
  const amountMismatchCount = Math.floor(orders.length * 0.2); // 20% 金额不一致（包含在核销记录中）
  const duplicateVerificationCount = Math.floor(orders.length * 0.1); // 10% 重复核销
  const missingVerificationCount = Math.floor(orders.length * 0.1); // 10% 未核销
  
  console.log('\n预期差异分布:');
  console.log(`  - 正常订单: ~${normalCount} 条`);
  console.log(`  - 已核销但无流水: ~${missingCashFlowCount} 条`);
  console.log(`  - 金额不一致: ~${amountMismatchCount} 条`);
  console.log(`  - 重复核销: ~${duplicateVerificationCount} 条`);
  console.log(`  - 未核销: ~${missingVerificationCount} 条`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('✅ 测试数据生成完成！');
  console.log(`📁 文件位置: ${path.resolve(CONFIG.OUTPUT_DIR)}\n`);
}

// 执行主函数
main().catch(err => {
  console.error('❌ 生成失败:', err);
  process.exit(1);
});
