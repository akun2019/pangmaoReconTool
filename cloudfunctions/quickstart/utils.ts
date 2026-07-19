/**
 * 公共工具函数模块
 * 
 * 提供数据导入相关的通用工具函数，避免代码重复
 */

// ==================== 类型定义 ====================

export interface ImportResult {
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
  errors: string[];
}

export interface BatchInfo {
  batchNo: string;
  dataType: 'orders' | 'verification' | 'cash_flow';
  fileName: string;
  fileId: string;
}

// ==================== 日期时间工具 ====================

/**
 * 将 Date 对象格式化为 YYYY-MM-DD HH:mm:ss
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化任意日期值为 ISO 8601 格式字符串
 * @param dateValue - 可以是字符串、数字（Excel序列号）、Date对象
 * @returns 格式化后的日期字符串，或 null（如果无法解析）
 */
export function formatDateTime(dateValue: any): string | null {
  if (!dateValue) return null;
  
  // 如果已经是字符串格式
  if (typeof dateValue === 'string') {
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

// ==================== 数据验证工具 ====================

/**
 * 验证并清理字符串字段
 * @param value - 原始值
 * @param fieldName - 字段名（用于错误提示）
 * @param required - 是否必填
 * @returns 清理后的字符串
 */
export function validateString(value: any, fieldName: string, required: boolean = true): string {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${fieldName}不能为空`);
    }
    return '';
  }
  
  const strValue = String(value).trim();
  
  if (required && strValue.length === 0) {
    throw new Error(`${fieldName}不能为空`);
  }
  
  return strValue;
}

/**
 * 验证并清理数字字段
 * @param value - 原始值
 * @param fieldName - 字段名（用于错误提示）
 * @param required - 是否必填
 * @param min - 最小值（可选）
 * @param max - 最大值（可选）
 * @returns 清理后的数字（保留2位小数）
 */
export function validateNumber(
  value: any, 
  fieldName: string, 
  required: boolean = true,
  min?: number,
  max?: number
): number {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${fieldName}不能为空`);
    }
    return 0;
  }
  
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    throw new Error(`${fieldName}必须是有效数字`);
  }
  
  if (min !== undefined && numValue < min) {
    throw new Error(`${fieldName}不能小于${min}`);
  }
  
  if (max !== undefined && numValue > max) {
    throw new Error(`${fieldName}不能大于${max}`);
  }
  
  return parseFloat(numValue.toFixed(2));
}

/**
 * 验证枚举值
 * @param value - 原始值
 * @param fieldName - 字段名
 * @param validValues - 有效值列表
 * @param defaultValue - 默认值
 * @returns 验证后的值
 */
export function validateEnum<T extends string>(
  value: any,
  fieldName: string,
  validValues: T[],
  defaultValue?: T
): T {
  const strValue = value ? String(value).trim() : defaultValue;
  
  if (!strValue) {
    if (defaultValue) {
      return defaultValue;
    }
    throw new Error(`${fieldName}不能为空`);
  }
  
  if (!validValues.includes(strValue as T)) {
    throw new Error(`${fieldName}必须是以下值之一: ${validValues.join(', ')}`);
  }
  
  return strValue as T;
}

// ==================== 批次管理工具 ====================

/**
 * 生成批次号
 * @returns 批次号，格式：BATCH_YYYYMMDD_HHMMSS_XXX
 */
export function generateBatchNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 900) + 100);
  
  return `BATCH_${year}${month}${day}_${hours}${minutes}${seconds}_${random}`;
}

// ==================== Excel/CSV 解析工具 ====================

/**
 * 从 Buffer 解析 Excel/CSV 文件为 JSON 数组
 * @param fileBuffer - 文件内容的 Buffer
 * @returns JSON 数据数组
 */
export async function parseExcelFile(fileBuffer: Buffer): Promise<any[]> {
  // 动态导入 xlsx（避免在云端环境外报错）
  const XLSX = await import('xlsx');
  
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  return XLSX.utils.sheet_to_json(worksheet);
}

// ==================== 批量处理工具 ====================

/**
 * 分批处理数组
 * @param items - 要处理的数组
 * @param batchSize - 每批大小
 * @param processor - 处理函数
 * @returns 处理结果数组
 */
export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<{ results: R[]; errors: string[] }> {
  const results: R[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    try {
      const batchResults = await processor(batch);
      results.push(...batchResults);
    } catch (error: any) {
      errors.push(`批次 ${Math.floor(i / batchSize) + 1} 处理失败: ${error.message}`);
    }
  }
  
  return { results, errors };
}

// ==================== 日志工具 ====================

/**
 * 统一的日志格式
 */
export function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
}

export function logError(message: string, error?: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`, error || '');
}
