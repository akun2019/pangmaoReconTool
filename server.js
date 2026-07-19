/**
 * HTTP 服务器包装器 - 用于 FaaS 平台部署
 * 
 * ⚠️ 重要说明：
 * 本项目设计为抖音云开发 Serverless 架构，此文件仅用于兼容 FaaS 平台
 * 推荐使用抖音云开发控制台直接部署云函数（无需此文件）
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8000;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '胖猫智能订单核销对账工具 API',
    version: '1.0.0',
    endpoints: [
      '/upload_file',
      '/parse_and_import_orders',
      '/parse_and_import_verifications',
      '/parse_and_import_cashflows',
      '/get_import_status',
      '/run_reconciliation',
      '/get_discrepancy_list',
      '/get_reconciliation_summary'
    ]
  });
});

// TODO: 在这里导入并注册云函数
// 由于云函数依赖抖音云 SDK，在本地/容器中无法直接使用
// 需要重构为标准的 Express 路由

app.post('/upload_file', async (req, res) => {
  res.json({
    success: false,
    message: '此端点需要在抖音云环境中运行。请使用抖音云开发控制台部署。'
  });
});

app.post('/parse_and_import_orders', async (req, res) => {
  res.json({
    success: false,
    message: '此端点需要在抖音云环境中运行。请使用抖音云开发控制台部署。'
  });
});

app.post('/parse_and_import_verifications', async (req, res) => {
  res.json({
    success: false,
    message: '此端点需要在抖音云环境中运行。请使用抖音云开发控制台部署。'
  });
});

app.post('/parse_and_import_cashflows', async (req, res) => {
  res.json({
    success: false,
    message: '此端点需要在抖音云环境中运行。请使用抖音云开发控制台部署。'
  });
});

app.post('/get_import_status', async (req, res) => {
  res.json({
    success: false,
    message: '此端点需要在抖音云环境中运行。请使用抖音云开发控制台部署。'
  });
});

app.post('/run_reconciliation', async (req, res) => {
  res.json({
    success: false,
    message: '此端点需要在抖音云环境中运行。请使用抖音云开发控制台部署。'
  });
});

app.post('/get_discrepancy_list', async (req, res) => {
  res.json({
    success: false,
    message: '此端点需要在抖音云环境中运行。请使用抖音云开发控制台部署。'
  });
});

app.post('/get_reconciliation_summary', async (req, res) => {
  res.json({
    success: false,
    message: '此端点需要在抖音云环境中运行。请使用抖音云开发控制台部署。'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 胖猫智能订单核销对账工具 API 已启动`);
  console.log(`📍 监听端口: ${PORT}`);
  console.log(`⚠️  注意: 此应用需要在抖音云环境中才能正常工作`);
  console.log(`💡 推荐: 使用抖音云开发控制台部署云函数`);
});

module.exports = app;
