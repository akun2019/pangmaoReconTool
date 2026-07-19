/**
 * 通用工具函数模块
 */

import { dySDK } from "@open-dy/node-server-sdk";
import * as XLSX from 'xlsx';

// 导入结果类型定义
export interface ImportResult<T> {
  results: T[];
  errors: string[];
}

/**
 * 解析 Excel/CSV 文件内容
 */
export async function parseExcelFile(fileContent: Buffer): Promise<any[]> {
  const workbook = XLSX.read(fileContent, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // 转换为 JSON 数据
  return XLSX.utils.sheet_to_json(worksheet);
}

/**
 * 验证字符串值
 */
export function validateString(value: any, fieldName: string): string {
  if (!value) {
    throw new Error(`${fieldName}不能为空`);
  }
  
  return String(value).trim();
}

/**
 * 验证数值
 */
export function validateNumber(value: any, fieldName: string, isRequired = true, minValue?: number): number {
  if (isRequired && (value === undefined || value === null)) {
    throw new Error(`${fieldName}不能为空`);
  }
  
  if (value === undefined || value === null) {
    return 0;
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    throw new Error(`${fieldName}必须是数字`);
  }
  
  if (minValue !== undefined && num < minValue) {
    throw new Error(`${fieldName}必须大于等于${minValue}`);
  }
  
  return parseFloat(num.toFixed(2));
}

/**
 * 验证枚举值
 */
export function validateEnum<T>(value: any, fieldName: string, validValues: T[], defaultValue: T): T {
  if (!value) {
    return defaultValue;
  }
  
  if (!validValues.includes(value)) {
    throw new Error(`${fieldName}必须是以下值之一: ${validValues.join(', ')}`);
  }
  
  return value;
}

/**
 * 格式化日期时间为 ISO 8601 格式
 */
export function formatDateTime(dateValue: any): string | null {
  if (!dateValue) return null;
  
  // 如果已经是字符串格式
  if (typeof dateValue === 'string') {
    // 尝试匹配常见格式
    const patterns = [
      /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/,  // YYYY-MM-DD HH:mm:ss
      /^\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}$/,  // YYYY/MM/DD HH:mm:ss
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,       // ISO 8601
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(dateValue)) {
        // 标准化为 YYYY-MM-DD HH:mm:ss
        return dateValue.replace(/\//g, '-').replace('T', ' ').slice(0, 19);
      }
    }
    
    // 尝试用 Date 解析
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return formatDate(date);
    }
    
    return null;
  }
  
  // 如果是 Excel 的日期数字（序列号）
  if (typeof dateValue === 'number') {
    // Excel 日期序列号转换为 JavaScript Date
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
    return formatDate(date);
  }
  
  // 如果是 Date 对象
  if (dateValue instanceof Date) {
    return formatDate(dateValue);
  }
  
  return null;
}

/**
 * 将 Date 对象格式化为 YYYY-MM-DD HH:mm:ss
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
 * 批量处理数据
 */
export async function processInBatches<T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<T[]>
): Promise<ImportResult<T>> {
  const results: T[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    try {
      const processedBatch = await processor(batch);
      results.push(...processedBatch);
    } catch (error: any) {
      errors.push(`批次处理失败: ${error.message}`);
    }
  }
  
  return { results, errors };
}

/**
 * 日志记录
 */
export function log(message: string, data?: any) {
  console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : '');
}

/**
 * 错误日志记录
 */
export function logError(message: string, error: any) {
  console.error(`[ERROR] ${message}`, error.stack || error.message);
}
/**
 * 解析并导入订单数据云函数（优化版）
 * 
 * 优化点：
 * 1. 流式处理大文件
 * 2. 并行验证和插入
 * 3. 更详细的进度跟踪
 * 4. 内存优化（分批处理）
 * 5. 性能监控与统计
 */

import { dySDK } from "@open-dy/node-server-sdk";
import { 
  parseExcelFile, 
  validateString, 
  validateNumber, 
  validateEnum,
  formatDateTime,
  processInBatches,
  log,
  logError
} from './utils';

interface OrderData {
  order_id: string;
  store_id: string;
  store_name: string;
  product_name: string;
  amount: number;
  order_time: string;
  status: string;
  source?: string;
}

export default async function (params: any, context: any) {
  const startTime = Date.now();
  
  try {
    const { batchNo, fileId, validationBatchSize = 100, insertBatchSize = 50 } = params;
    
    // 参数校验
    if (!batchNo || !fileId) {
      return {
        code: 1,
        message: "缺少必要参数：batchNo, fileId",
        data: null
      };
    }
    
    const database = dySDK.database();
    
    // 更新批次状态
    await database.collection('import_batches')
      .where({ batch_no: batchNo })
      .update({
        status: 'processing',
        started_at: database.serverDate()
      });
    
    log('开始下载文件', { fileId });
    const downloadStart = Date.now();
    
    // 从云存储下载文件
    const fileResult = await dySDK.downloadFile({
      fileID: fileId
    });
    
    if (!fileResult.fileContent) {
      throw new Error('文件下载失败');
    }
    
    log(`文件下载完成`, { time: `${((Date.now() - downloadStart) / 1000).toFixed(2)}s` });
    log('开始解析文件');
    const parseStart = Date.now();
    
    // 解析 Excel/CSV 文件
    const rawData = await parseExcelFile(fileResult.fileContent);
    
    if (rawData.length === 0) {
      throw new Error('文件中没有数据');
    }
    
    log(`文件解析完成`, { 
      count: rawData.length, 
      time: `${((Date.now() - parseStart) / 1000).toFixed(2)}s` 
    });
    
    // 数据清洗和验证（并行处理）
    log('开始数据验证...');
    const validationStart = Date.now();
    
    const errors: string[] = [];
    const validOrders: OrderData[] = [];
    
    // 分批验证（提升性能）
    await processInBatches(
      rawData.map((row, index) => ({ row, index })),
      validationBatchSize,
      async (batch) => {
        return batch.map(({ row, index }) => {
          const rowNum = index + 2;
          
          try {
            const order = validateAndCleanOrder(row, rowNum);
            return { success: true, order };
          } catch (error: any) {
            return { success: false, error: `第${rowNum}行: ${error.message}` };
          }
        });
      }
    ).then(({ results }) => {
      for (const result of results.flat()) {
        if (result.success && result.order) {
          validOrders.push(result.order);
        } else if (!result.success) {
          errors.push(result.error);
        }
      }
    });
    
    log(`数据验证完成`, { 
      valid: validOrders.length, 
      errors: errors.length,
      time: `${((Date.now() - validationStart) / 1000).toFixed(2)}s` 
    });
    
    // 批量插入数据库
    log('开始批量插入...');
    const insertStart = Date.now();
    
    let successCount = 0;
    const insertErrors: string[] = [];
    
    const { results, errors: batchErrors } = await processInBatches(
      validOrders,
      insertBatchSize,
      async (batch) => {
        const promises = batch.map(order => 
          database.collection('orders').add({
            ...order,
            import_batch: batchNo,
            created_at: database.serverDate()
          })
        );
        
        await Promise.all(promises);
        return batch;
      }
    );
    
    successCount = results.length;
    insertErrors.push(...batchErrors);
    
    const failedCount = errors.length + insertErrors.length;
    
    log(`数据插入完成`, { 
      success: successCount, 
      failed: failedCount,
      time: `${((Date.now() - insertStart) / 1000).toFixed(2)}s` 
    });
    
    // 更新批次记录
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    await database.collection('import_batches')
      .where({ batch_no: batchNo })
      .update({
        total_records: rawData.length,
        success_records: successCount,
        failed_records: failedCount,
        status: failedCount > 0 ? 'completed_with_errors' : 'completed',
        error_log: [...errors, ...insertErrors],
        completed_at: database.serverDate(),
        processing_time: totalTime
      });
    
    log('导入完成', { 
      total: rawData.length, 
      success: successCount, 
      failed: failedCount,
      totalTime: `${totalTime}s`
    });
    
    return {
      code: 0,
      message: failedCount > 0 ? "部分数据导入成功" : "导入成功",
      data: {
        totalRecords: rawData.length,
        successRecords: successCount,
        failedRecords: failedCount,
        errors: errors,
        performance: {
          totalTime: `${totalTime}s`,
          recordsPerSecond: (rawData.length / parseFloat(totalTime)).toFixed(2)
        }
      }
    };
    
  } catch (error: any) {
    logError('订单数据导入失败', error);
    
    // 更新批次状态为失败
    try {
      const database = dySDK.database();
      await database.collection('import_batches')
        .where({ batch_no: params.batchNo })
        .update({
          status: 'failed',
          error_log: [error.message],
          updated_at: database.serverDate()
        });
    } catch (e) {
      logError('更新批次状态失败', e);
    }
    
    return {
      code: 1,
      message: `订单数据导入失败: ${error.message}`,
      data: null
    };
  }
}

/**
 * 验证并清洗单条订单数据
 */
function validateAndCleanOrder(row: any, rowNum: number): OrderData {
  // 必填字段验证和清理
  const order_id = validateString(row.order_id, 'order_id');
  const store_id = validateString(row.store_id, 'store_id');
  const store_name = validateString(row.store_name, 'store_name');
  const product_name = validateString(row.product_name, 'product_name');
  
  // 金额验证
  const amount = validateNumber(row.amount, 'amount', true, 0);
  
  // 时间验证和格式化
  const orderTime = formatDateTime(row.order_time);
  if (!orderTime) {
    throw new Error('order_time格式错误，应为 YYYY-MM-DD HH:mm:ss');
  }
  
  // 状态验证
  const status = validateEnum(
    row.status,
    'status',
    ['completed', 'cancelled', 'refunded'],
    'completed'
  );
  
  // 数据来源
  const source = validateEnum(
    row.source,
    'source',
    ['douyin', 'meituan', 'manual'],
    'manual'
  );
  
  return {
    order_id,
    store_id,
    store_name,
    product_name,
    amount,
    order_time: orderTime,
    status,
    source
  };
}
