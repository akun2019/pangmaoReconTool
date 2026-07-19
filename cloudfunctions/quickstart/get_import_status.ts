/**
 * 查询导入状态云函数
 * 
 * 功能：查询指定批次的导入进度和结果
 * 
 * 请求参数:
 * {
 *   "batchNo": "BATCH_20260711_143000_123"  // 可选，不传则返回最近10条
 * }
 * 
 * 响应结果:
 * {
 *   "code": 0,
 *   "message": "",
 *   "data": {
 *     "batch_no": "BATCH_20260711_143000_123",
 *     "data_type": "orders",
 *     "file_name": "orders.xlsx",
 *     "total_records": 120,
 *     "success_records": 118,
 *     "failed_records": 2,
 *     "status": "completed",
 *     "error_log": ["第5行: order_id不能为空"],
 *     "imported_at": "2026-07-11T14:30:00.000Z"
 *   }
 * }
 */

import { dySDK } from "@open-dy/node-server-sdk";

export default async function (params: any, context: any) {
  try {
    const database = dySDK.database();
    const { batchNo } = params;
    
    let result;
    
    if (batchNo) {
      // 查询指定批次
      result = await database.collection('import_batches')
        .where({ batch_no: batchNo })
        .get();
    } else {
      // 查询最近10条记录
      result = await database.collection('import_batches')
        .aggregate()
        .sort({ imported_at: -1 })
        .limit(10)
        .end();
    }
    
    if (!result.data || result.data.length === 0) {
      return {
        code: 0,
        message: batchNo ? "未找到该批次记录" : "暂无导入记录",
        data: batchNo ? null : []
      };
    }
    
    return {
      code: 0,
      message: "查询成功",
      data: batchNo ? result.data[0] : result.data
    };
    
  } catch (error: any) {
    console.error('查询导入状态失败:', error);
    return {
      code: 1,
      message: `查询失败: ${error.message}`,
      data: null
    };
  }
}
