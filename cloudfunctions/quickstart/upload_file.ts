/**
 * 文件上传云函数
 * 
 * 功能：将 Excel/CSV 文件上传到抖音云存储
 * 
 * 请求参数:
 * {
 *   "fileName": "orders_20260711.xlsx",
 *   "fileContent": "base64编码的文件内容",
 *   "dataType": "orders" // orders | verification | cash_flow
 * }
 * 
 * 响应结果:
 * {
 *   "code": 0,
 *   "message": "",
 *   "data": {
 *     "fileId": "cloud://xxx/xxx.xlsx",
 *     "batchNo": "BATCH_20260711_143000_123"
 *   }
 * }
 */

import { dySDK } from "@open-dy/node-server-sdk";
import * as dayjs from 'dayjs';

export default async function (params: any, context: any) {
  try {
    const { fileName, fileContent, dataType } = params;
    
    // 参数校验
    if (!fileName || !fileContent || !dataType) {
      return {
        code: 1,
        message: "缺少必要参数：fileName, fileContent, dataType",
        data: null
      };
    }
    
    // 验证数据类型类型
    const validTypes = ['orders', 'verification', 'cash_flow'];
    if (!validTypes.includes(dataType)) {
      return {
        code: 1,
        message: `不支持的数据类型：${dataType}，支持：${validTypes.join(', ')}`,
        data: null
      };
    }
    
    // 验证文件格式
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExtension = allowedExtensions.some(ext => 
      fileName.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      return {
        code: 1,
        message: `不支持的文件格式，支持：${allowedExtensions.join(', ')}`,
        data: null
      };
    }
    
    // 生成批次号
    const timestamp = dayjs().format('YYYYMMDD_HHmmss');
    const random = String(Math.floor(Math.random() * 900) + 100);
    const batchNo = `BATCH_${timestamp}_${random}`;
    
    // 构建云存储路径
    const cloudPath = `reconciliation/${dataType}/${batchNo}/${fileName}`;
    
    // 解码 base64 内容
    const buffer = Buffer.from(fileContent, 'base64');
    
    // 上传到云存储
    const uploadResult = await dySDK.uploadFile({
      cloudPath: cloudPath,
      fileContent: buffer
    });
    
    if (!uploadResult.fileID) {
      throw new Error('文件上传失败');
    }
    
    // 在数据库中创建导入批次记录
    const database = dySDK.database();
    await database.collection('import_batches').add({
      batch_no: batchNo,
      data_type: dataType,
      file_name: fileName,
      file_path: uploadResult.fileID,
      total_records: 0,
      success_records: 0,
      failed_records: 0,
      status: 'uploaded',
      error_log: [],
      imported_by: context.OPENID || 'unknown',
      imported_at: database.serverDate()
    });
    
    return {
      code: 0,
      message: "文件上传成功",
      data: {
        fileId: uploadResult.fileID,
        batchNo: batchNo,
        cloudPath: cloudPath
      }
    };
    
  } catch (error: any) {
    console.error('文件上传失败:', error);
    return {
      code: 1,
      message: `文件上传失败: ${error.message || '未知错误'}`,
      data: null
    };
  }
}
