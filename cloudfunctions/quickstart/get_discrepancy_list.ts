/**
 * 获取差异清单云函数
 * 
 * 功能：查询差异记录，支持筛选、排序、分页
 * 
 * 请求参数:
 * {
 *   "discrepancyType": "MISSING_CASH_FLOW",  // 可选
 *   "storeId": "STORE_001",                   // 可选
 *   "startDate": "2026-07-01",                // 可选
 *   "endDate": "2026-07-15",                  // 可选
 *   "status": "pending",                      // 可选
 *   "page": 1,                                // 可选，默认1
 *   "pageSize": 20,                           // 可选，默认20
 *   "sortBy": "detected_time",                // 可选，默认detected_time
 *   "sortOrder": "desc"                       // 可选，asc/desc
 * }
 */

import { dySDK } from "@open-dy/node-server-sdk";
import { log, logError } from './utils';

export default async function (params: any, context: any) {
  try {
    const {
      discrepancyType,
      storeId,
      startDate,
      endDate,
      status,
      page = 1,
      pageSize = 20,
      sortBy = 'detected_time',
      sortOrder = 'desc'
    } = params;
    
    const database = dySDK.database();
    
    // 构建查询条件
    let query: any = {};
    
    if (discrepancyType) {
      query.discrepancy_type = discrepancyType;
    }
    
    if (storeId) {
      query.store_id = storeId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.detected_time = {};
      if (startDate) {
        query.detected_time = database.command.gte(startDate);
      }
      if (endDate) {
        query.detected_time = database.command.lte(endDate + ' 23:59:59');
      }
    }
    
    log('查询差异记录', { query, page, pageSize });
    
    // 执行查询
    const collection = database.collection('discrepancy_records');
    
    // 先获取总数
    const countResult = await collection.where(query).count();
    const total = countResult.total || 0;
    
    // 获取分页数据
    let resultQuery = collection.where(query);
    
    // 排序
    const order = sortOrder === 'asc' ? 1 : -1;
    resultQuery = resultQuery.orderBy(sortBy, order);
    
    // 分页
    const skip = (page - 1) * pageSize;
    resultQuery = resultQuery.skip(skip).limit(pageSize);
    
    const result = await resultQuery.get();
    
    log(`查询成功: 总数${total}, 返回${result.data?.length || 0}条`);
    
    return {
      code: 0,
      message: "查询成功",
      data: {
        list: result.data || [],
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    };
    
  } catch (error: any) {
    logError('查询差异记录失败', error);
    return {
      code: 1,
      message: `查询失败: ${error.message}`,
      data: null
    };
  }
}
