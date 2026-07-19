/**
 * 运行对账引擎云函数
 * 
 * 功能：执行订单-核销-流水三方比对，检测并标记差异
 * 
 * 请求参数:
 * {
 *   "startDate": "2026-07-01",
 *   "endDate": "2026-07-15",
 *   "storeId": "STORE_001"  // 可选，不传则对所有门店对账
 * }
 * 
 * 响应结果:
 * {
 *   "code": 0,
 *   "message": "对账完成",
 *   "data": {
 *     "totalOrders": 120,
 *     "totalDiscrepancies": 45,
 *     "discrepancyBreakdown": {
 *       "MISSING_CASH_FLOW": 15,
 *       "MISSING_VERIFICATION": 10,
 *       "AMOUNT_MISMATCH": 12,
 *       "DUPLICATE_VERIFICATION": 8
 *     },
 *     "processingTime": "5.2s"
 *   }
 * }
 */

import { dySDK } from "@open-dy/node-server-sdk";
import { log, logError } from './utils';

// ==================== 类型定义 ====================

enum DiscrepancyType {
  MISSING_CASH_FLOW = 'MISSING_CASH_FLOW',           // 已核销但无流水
  MISSING_VERIFICATION = 'MISSING_VERIFICATION',     // 有流水但未核销
  AMOUNT_MISMATCH = 'AMOUNT_MISMATCH',               // 金额不一致
  DUPLICATE_VERIFICATION = 'DUPLICATE_VERIFICATION'  // 重复核销
}

interface Order {
  _id: string;
  order_id: string;
  store_id: string;
  store_name: string;
  product_name: string;
  amount: number;
  order_time: string;
  status: string;
}

interface Verification {
  _id: string;
  order_id: string;
  store_id: string;
  verify_time: string;
  verify_amount: number;
  operator: string;
}

interface CashFlow {
  _id: string;
  order_id?: string;
  store_id: string;
  amount: number;
  record_time: string;
  payment_method: string;
}

interface Discrepancy {
  order_id: string;
  store_id: string;
  store_name: string;
  discrepancy_type: DiscrepancyType;
  expected_amount: number;
  actual_amount: number;
  difference: number;
  detected_time: string;
  status: string;
  suggestion: string;
}

// ==================== 主函数 ====================

export default async function (params: any, context: any) {
  const startTime = Date.now();
  
  try {
    const { startDate, endDate, storeId } = params;
    
    // 参数校验
    if (!startDate || !endDate) {
      return {
        code: 1,
        message: "缺少必要参数：startDate, endDate",
        data: null
      };
    }
    
    log('开始执行对账', { startDate, endDate, storeId });
    
    const database = dySDK.database();
    
    // 1. 读取订单数据
    log('读取订单数据...');
    const orders = await fetchOrders(database, startDate, endDate, storeId);
    log(`读取到 ${orders.length} 条订单`);
    
    if (orders.length === 0) {
      return {
        code: 0,
        message: "指定时间范围内无订单数据",
        data: {
          totalOrders: 0,
          totalDiscrepancies: 0,
          discrepancyBreakdown: {},
          processingTime: `${((Date.now() - startTime) / 1000).toFixed(2)}s`
        }
      };
    }
    
    // 2. 读取核销记录
    log('读取核销记录...');
    const verifications = await fetchVerifications(database, startDate, endDate, storeId);
    log(`读取到 ${verifications.length} 条核销记录`);
    
    // 3. 读取收银流水
    log('读取收银流水...');
    const cashFlows = await fetchCashFlows(database, startDate, endDate, storeId);
    log(`读取到 ${cashFlows.length} 条流水记录`);
    
    // 4. 构建索引（按 order_id 分组）
    log('构建索引...');
    const verificationMap = groupBy(verifications, 'order_id');
    const cashFlowMap = groupBy(cashFlows.filter(cf => cf.order_id), 'order_id');
    
    // 5. 执行对账，检测差异
    log('执行对账检测...');
    const discrepancies: Discrepancy[] = [];
    
    for (const order of orders) {
      const relatedVerifications = verificationMap[order.order_id] || [];
      const relatedCashFlows = cashFlowMap[order.order_id] || [];
      
      // 检测规则 1: 已核销但无流水
      if (relatedVerifications.length > 0 && relatedCashFlows.length === 0) {
        discrepancies.push(createDiscrepancy(
          order,
          DiscrepancyType.MISSING_CASH_FLOW,
          relatedVerifications[0].verify_amount,
          0,
          '疑似漏刷POS机，建议核实收银台流水记录'
        ));
      }
      
      // 检测规则 2: 有流水但未核销
      if (relatedVerifications.length === 0 && relatedCashFlows.length > 0) {
        discrepancies.push(createDiscrepancy(
          order,
          DiscrepancyType.MISSING_VERIFICATION,
          order.amount,
          relatedCashFlows[0].amount,
          '疑似未核销团购券，建议检查核销记录'
        ));
      }
      
      // 检测规则 3: 金额不一致
      for (const verification of relatedVerifications) {
        const diff = Math.abs(order.amount - verification.verify_amount);
        if (diff > 0.01) {
          discrepancies.push(createDiscrepancy(
            order,
            DiscrepancyType.AMOUNT_MISMATCH,
            order.amount,
            verification.verify_amount,
            `差额${(order.amount - verification.verify_amount).toFixed(2)}元，建议核对是否有折扣或优惠`
          ));
        }
      }
      
      // 检测规则 4: 重复核销
      if (relatedVerifications.length > 1) {
        discrepancies.push(createDiscrepancy(
          order,
          DiscrepancyType.DUPLICATE_VERIFICATION,
          order.amount,
          order.amount * relatedVerifications.length,
          `同一订单被核销${relatedVerifications.length}次，建议核查核销记录`
        ));
      }
    }
    
    log(`检测到 ${discrepancies.length} 条差异`);
    
    // 6. 保存差异记录
    if (discrepancies.length > 0) {
      log('保存差异记录...');
      await saveDiscrepancies(database, discrepancies);
      log('差异记录保存成功');
    }
    
    // 7. 生成统计报告
    const summary = generateSummary(orders, discrepancies);
    
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    log('对账完成', { processingTime: `${processingTime}s` });
    
    return {
      code: 0,
      message: "对账完成",
      data: {
        ...summary,
        processingTime: `${processingTime}s`
      }
    };
    
  } catch (error: any) {
    logError('对账执行失败', error);
    return {
      code: 1,
      message: `对账失败: ${error.message}`,
      data: null
    };
  }
}

// ==================== 数据获取函数 ====================

/**
 * 获取订单数据
 */
async function fetchOrders(
  database: any,
  startDate: string,
  endDate: string,
  storeId?: string
): Promise<Order[]> {
  let query = database.collection('orders')
    .where({
      order_time: database.command.gte(startDate),
      order_time: database.command.lte(endDate + ' 23:59:59')
    });
  
  if (storeId) {
    query = query.where({ store_id: storeId });
  }
  
  const result = await query.get();
  return result.data || [];
}

/**
 * 获取核销记录
 */
async function fetchVerifications(
  database: any,
  startDate: string,
  endDate: string,
  storeId?: string
): Promise<Verification[]> {
  let query = database.collection('verification_records')
    .where({
      verify_time: database.command.gte(startDate),
      verify_time: database.command.lte(endDate + ' 23:59:59')
    });
  
  if (storeId) {
    query = query.where({ store_id: storeId });
  }
  
  const result = await query.get();
  return result.data || [];
}

/**
 * 获取收银流水
 */
async function fetchCashFlows(
  database: any,
  startDate: string,
  endDate: string,
  storeId?: string
): Promise<CashFlow[]> {
  let query = database.collection('cash_flow_records')
    .where({
      record_time: database.command.gte(startDate),
      record_time: database.command.lte(endDate + ' 23:59:59')
    });
  
  if (storeId) {
    query = query.where({ store_id: storeId });
  }
  
  const result = await query.get();
  return result.data || [];
}

// ==================== 工具函数 ====================

/**
 * 按字段分组
 */
function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * 创建差异记录
 */
function createDiscrepancy(
  order: Order,
  type: DiscrepancyType,
  expectedAmount: number,
  actualAmount: number,
  suggestion: string
): Discrepancy {
  const difference = parseFloat((expectedAmount - actualAmount).toFixed(2));
  
  return {
    order_id: order.order_id,
    store_id: order.store_id,
    store_name: order.store_name,
    discrepancy_type: type,
    expected_amount: expectedAmount,
    actual_amount: actualAmount,
    difference: difference,
    detected_time: new Date().toISOString(),
    status: 'pending',
    suggestion: suggestion
  };
}

/**
 * 批量保存差异记录
 */
async function saveDiscrepancies(database: any, discrepancies: Discrepancy[]): Promise<void> {
  const batchSize = 50;
  
  for (let i = 0; i < discrepancies.length; i += batchSize) {
    const batch = discrepancies.slice(i, i + batchSize);
    
    const promises = batch.map(d => 
      database.collection('discrepancy_records').add({
        ...d,
        created_at: database.serverDate()
      })
    );
    
    await Promise.all(promises);
  }
}

/**
 * 生成统计报告
 */
function generateSummary(orders: Order[], discrepancies: Discrepancy[]) {
  // 按类型统计
  const breakdown: Record<string, { count: number; totalAmount: number }> = {};
  
  for (const d of discrepancies) {
    if (!breakdown[d.discrepancy_type]) {
      breakdown[d.discrepancy_type] = { count: 0, totalAmount: 0 };
    }
    breakdown[d.discrepancy_type].count++;
    breakdown[d.discrepancy_type].totalAmount += Math.abs(d.difference);
  }
  
  // 计算总额
  for (const key in breakdown) {
    breakdown[key].totalAmount = parseFloat(breakdown[key].totalAmount.toFixed(2));
  }
  
  return {
    totalOrders: orders.length,
    totalDiscrepancies: discrepancies.length,
    discrepancyBreakdown: breakdown
  };
}
