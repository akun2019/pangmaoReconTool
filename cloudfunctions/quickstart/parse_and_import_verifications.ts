/**
 * 解析并导入核销记录云函数
 * 
 * 功能：从云存储下载 Excel/CSV 文件，解析后批量导入到 verification_records 集合
 * 
 * 请求参数:
 * {
 *   "batchNo": "BATCH_20260711_143000_123",
 *   "fileId": "cloud://xxx/verifications.xlsx"
 * }
 * 
 * 响应结果:
 * {
 *   "code": 0,
 *   "message": "导入成功",
 *   "data": {
 *     "totalRecords": 100,
 *     "successRecords": 98,
 *     "failedRecords": 2,
 *     "errors": ["第5行: order_id不能为空"]
 *   }
 * }
 */

import { dySDK } from "@open-dy/node-server-sdk";
import * as XLSX from 'xlsx';

interface VerificationData {
  order_id: string;
  store_id: string;
  verify_time: string;
  verify_amount: number;
  operator?: string;
  source?: string;
}

export default async function (params: any, context: any) {
  try {
    const { batchNo, fileId } = params;
    
    // 参数校验
    if (!batchNo || !fileId) {
      return {
        code: 1,
        message: "缺少必要参数：batchNo, fileId",
        data: null
      };
    }
    
    const database = dySDK.database();
    
    // 更新批次状态为处理中
    await database.collection('import_batches')
      .where({ batch_no: batchNo })
      .update({
        status: 'processing'
      });
    
    // 从云存储下载文件
    console.log('开始下载文件:', fileId);
    const fileResult = await dySDK.downloadFile({
      fileID: fileId
    });
    
    if (!fileResult.fileContent) {
      throw new Error('文件下载失败');
    }
    
    // 解析 Excel/CSV 文件
    console.log('开始解析文件');
    const workbook = XLSX.read(fileResult.fileContent, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为 JSON 数据
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
    
    if (rawData.length === 0) {
      throw new Error('文件中没有数据');
    }
    
    console.log(`解析到 ${rawData.length} 条原始数据`);
    
    // 数据清洗和验证
    const errors: string[] = [];
    const validRecords: VerificationData[] = [];
    
    rawData.forEach((row, index) => {
      const rowNum = index + 2; // Excel 行号
      
      try {
        const record = validateAndCleanVerification(row, rowNum);
        
        if (record) {
          validRecords.push(record);
        }
      } catch (error: any) {
        errors.push(`第${rowNum}行: ${error.message}`);
      }
    });
    
    console.log(`有效数据: ${validRecords.length} 条, 错误: ${errors.length} 条`);
    
    // 批量插入数据库
    let successCount = 0;
    const insertErrors: string[] = [];
    
    // 分批插入，每批 50 条
    const batchSize = 50;
    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize);
      
      try {
        const promises = batch.map(record => 
          database.collection('verification_records').add({
            ...record,
            operator: record.operator || '',
            source: record.source || 'manual',
            import_batch: batchNo,
            created_at: database.serverDate()
          })
        );
        
        await Promise.all(promises);
        successCount += batch.length;
      } catch (error: any) {
        insertErrors.push(`批次插入失败: ${error.message}`);
        console.error('批量插入失败:', error);
      }
    }
    
    const failedCount = errors.length + insertErrors.length;
    
    // 更新批次记录
    await database.collection('import_batches')
      .where({ batch_no: batchNo })
      .update({
        total_records: rawData.length,
        success_records: successCount,
        failed_records: failedCount,
        status: failedCount > 0 ? 'completed_with_errors' : 'completed',
        error_log: [...errors, ...insertErrors],
        updated_at: database.serverDate()
      });
    
    return {
      code: 0,
      message: failedCount > 0 ? "部分数据导入成功" : "导入成功",
      data: {
        totalRecords: rawData.length,
        successRecords: successCount,
        failedRecords: failedCount,
        errors: errors
      }
    };
    
  } catch (error: any) {
    console.error('核销记录导入失败:', error);
    
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
      console.error('更新批次状态失败:', e);
    }
    
    return {
      code: 1,
      message: `核销记录导入失败: ${error.message}`,
      data: null
    };
  }
}

/**
 * 验证并清洗单条核销记录
 */
function validateAndCleanVerification(row: any, rowNum: number): VerificationData | null {
  // 必填字段验证
  if (!row.order_id) {
    throw new Error('order_id不能为空');
  }
  
  if (!row.store_id) {
    throw new Error('store_id不能为空');
  }
  
  // 金额验证
  let verifyAmount: number;
  if (row.verify_amount === undefined || row.verify_amount === null) {
    throw new Error('verify_amount不能为空');
  }
  
  verifyAmount = parseFloat(row.verify_amount);
  if (isNaN(verifyAmount) || verifyAmount < 0) {
    throw new Error('verify_amount必须是正数');
  }
  
  // 时间验证和格式化
  let verifyTime: string;
  if (!row.verify_time) {
    throw new Error('verify_time不能为空');
  }
  
  verifyTime = formatDateTime(row.verify_time);
  if (!verifyTime) {
    throw new Error('verify_time格式错误，应为 YYYY-MM-DD HH:mm:ss');
  }
  
  // 数据来源
  const source = row.source || 'manual';
  const validSources = ['douyin', 'meituan', 'manual'];
  if (!validSources.includes(source)) {
    throw new Error(`source必须是以下值之一: ${validSources.join(', ')}`);
  }
  
  return {
    order_id: String(row.order_id).trim(),
    store_id: String(row.store_id).trim(),
    verify_time: verifyTime,
    verify_amount: parseFloat(verifyAmount.toFixed(2)),
    operator: row.operator ? String(row.operator).trim() : '',
    source: source
  };
}

/**
 * 格式化日期时间为 ISO 8601 格式
 */
function formatDateTime(dateValue: any): string | null {
  if (!dateValue) return null;
  
  // 如果已经是字符串格式
  if (typeof dateValue === 'string') {
    const patterns = [
      /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/,
      /^\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}$/,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(dateValue)) {
        return dateValue.replace(/\//g, '-').replace('T', ' ').slice(0, 19);
      }
    }
    
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return formatDate(date);
    }
    
    return null;
  }
  
  // 如果是 Excel 的日期数字
  if (typeof dateValue === 'number') {
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
