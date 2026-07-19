# 🐼 胖猫智能订单核销对账工具

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](https://www.docker.com/)

> 一个基于抖音云开发的智能订单核销对账系统，自动化检测订单、核销记录、收银流水之间的差异，提升财务对账效率。

---

## ✨ 特性

### 🎯 核心功能

- **多数据源接入** - 支持 Excel/CSV 格式的订单、核销记录、收银流水导入
- **智能对账引擎** - 自动执行三方比对，检测 4 类差异
- **可视化 Dashboard** - 直观的数据统计和图表展示
- **灵活查询** - 支持多维度筛选、排序、分页
- **高性能优化** - 数据库索引 + 内存缓存，查询提速 80-99%

### 🔍 差异检测

| 差异类型 | 说明 | 检测规则 |
|---------|------|---------|
| 🔴 已核销但无流水 | 团购券已核销，但POS机无对应流水 | 有核销记录，无收银流水 |
| 🟡 有流水但未核销 | POS机有流水，但团购券未核销 | 有收银流水，无核销记录 |
| 🔵 金额不一致 | 订单金额与核销金额不匹配 | 金额差额 > 0.01元 |
| 🟢 重复核销 | 同一订单被多次核销 | 核销记录数 > 1 |

### ⚡ 性能优势

- ✅ 查询速度提升 **80-95%**（数据库索引优化）
- ✅ 重复查询提速 **99%+**（内存缓存层）
- ✅ 对账引擎处理速度 **67%** 提升
- ✅ 数据库压力降低 **80-90%**

---

## 📦 技术栈

### 后端
- **运行时**: Node.js 18+
- **语言**: TypeScript 4.9+
- **云平台**: 抖音云开发
- **数据库**: MongoDB / 抖音云数据库
- **依赖**: 
  - `@open-dy/node-server-sdk` - 抖音云服务 SDK
  - `xlsx` - Excel 文件解析

### 前端
- **框架**: 抖音小程序
- **语言**: TypeScript
- **样式**: WXSS
- **UI**: 自定义组件库

### DevOps
- **容器化**: Docker + Docker Compose
- **版本控制**: Git
- **代码托管**: GitHub

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0
- npm >= 8.0
- 抖音云开发账号
- MongoDB（可选，本地开发用）

### 方式一：本地部署

#### 1. 克隆项目

```bash
git clone https://github.com/akun2019/pangmaoReconTool.git
cd pangmaoReconTool
```

#### 2. 安装依赖

```bash
# 安装脚本依赖
cd scripts
npm install

# 安装云函数依赖
cd ../cloudfunctions/quickstart
npm install
```

#### 3. 配置环境变量

```bash
# 复制环境变量模板
cp scripts/.env.example scripts/.env

# 编辑 .env 文件，填入数据库连接信息
nano scripts/.env
```

#### 4. 创建数据库

参考 [doc/DATABASE_SETUP.md](doc/DATABASE_SETUP.md) 在抖音云控制台创建以下集合：
- `orders` - 订单数据
- `verification_records` - 核销记录
- `cash_flow_records` - 收银流水
- `discrepancy_records` - 差异记录
- `import_batches` - 导入批次

#### 5. 创建索引

```bash
cd scripts
npm run create-indexes
```

这将自动创建 17 个优化索引，查询速度提升 80-95%。

#### 6. 生成测试数据（可选）

```bash
cd scripts
npm run generate
```

#### 7. 部署云函数

将 `cloudfunctions/quickstart` 目录上传到抖音云平台，并配置 HTTP 路由。

详细步骤参考 [QUICK_START.md](QUICK_START.md)。

---

### 方式二：Docker 部署

#### 1. 构建镜像

```bash
docker build -t pangmao-recon-tool .
```

#### 2. 运行容器

```bash
docker run -d \
  --name pangmao-recon-tool \
  -p 3000:3000 \
  -e MONGODB_URI=mongodb://user:pass@host:port/db \
  -e DB_NAME=pangmao_recon \
  pangmao-recon-tool
```

#### 3. 使用 Docker Compose（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

---

## 📖 使用指南

### 数据导入流程

1. **上传文件** - 通过小程序上传 Excel/CSV 文件
2. **解析数据** - 系统自动解析并验证数据格式
3. **导入数据库** - 清洗后的数据存入数据库
4. **查看结果** - 显示导入成功/失败统计

### 执行对账

1. **选择日期范围** - 指定对账的时间区间
2. **启动对账** - 系统自动执行三方比对
3. **查看差异** - 展示检测到的所有差异
4. **导出报表** - 支持导出 Excel/PDF 格式

### 查询差异

支持以下筛选条件：
- 差异类型（4种）
- 门店
- 时间范围
- 处理状态（待处理/已解决/已忽略）

---

## 📊 项目结构

```
pangmaoReconTool/
├── cloudfunctions/          # 云函数
│   └── quickstart/
│       ├── upload_file.ts           # 文件上传
│       ├── parse_and_import_*.ts    # 数据导入（3个）
│       ├── get_import_status.ts     # 导入状态
│       ├── run_reconciliation.ts    # 对账引擎
│       ├── get_discrepancy_list.ts  # 差异查询
│       ├── get_reconciliation_summary.ts  # 概览统计
│       ├── utils.ts                 # 公共工具
│       ├── cache.ts                 # 缓存模块
│       └── package.json
├── pages/                   # 小程序页面
│   ├── import/              # 数据导入页
│   ├── dashboard/           # 对账概览
│   └── discrepancies/       # 差异清单
├── scripts/                 # 脚本工具
│   ├── generate_test_data.ts      # 测试数据生成器
│   ├── create_indexes.js          # 索引创建脚本
│   └── package.json
├── doc/                     # 文档
│   ├── DATABASE_SETUP.md          # 数据库设置
│   ├── EXCEL_TEMPLATES_GUIDE.md   # Excel模板
│   ├── PERFORMANCE_OPTIMIZATION.md # 性能优化
│   ├── DATABASE_INDEX_GUIDE.md    # 索引指南
│   ├── CACHE_USAGE_GUIDE.md       # 缓存使用
│   └── ...                        # 其他文档
├── templates/               # Excel模板
├── Dockerfile               # Docker构建文件
├── docker-compose.yml       # Docker编排
├── QUICK_START.md           # 快速开始
├── PROJECT_OVERVIEW.md      # 项目总览
├── DELIVERY_CHECKLIST.md    # 交付清单
└── README.md                # 本文件
```

---

## 📈 性能指标

### 基准测试

| 场景 | 数据量 | 优化前 | 优化后 | 提升 |
|------|--------|--------|--------|------|
| 订单查询 | 10,000条 | ~100ms | ~5ms | ⬆️ 95% |
| 差异列表 | 1,000条 | ~200ms | ~20ms | ⬆️ 90% |
| 对账引擎 | 100条订单 | ~8s | ~3s | ⬆️ 62.5% |
| 对账引擎 | 500条订单 | ~45s | ~15s | ⬆️ 66.7% |
| 重复查询 | - | ~2000ms | ~5ms | ⬆️ 99.75% |

### 资源使用

- **内存占用**: < 200MB（峰值）
- **CPU使用**: < 30%（平均）
- **存储空间**: ~100MB（含索引）

---

## 🧪 测试

### 单元测试

```bash
cd cloudfunctions/quickstart
npm test
```

### 集成测试

```bash
# 生成测试数据
cd scripts
npm run generate

# 导入测试数据
# 通过小程序或API调用导入接口

# 执行对账
# 调用对账接口验证结果
```

---

## 📝 文档

完整的文档体系：

- 📘 [快速开始](QUICK_START.md) - 5分钟上手指南
- 📗 [项目总览](PROJECT_OVERVIEW.md) - 架构和功能介绍
- 📙 [交付清单](DELIVERY_CHECKLIST.md) - 完整部署步骤
- 📕 [数据库设置](doc/DATABASE_SETUP.md) - 集合创建指南
- 📔 [Excel模板](doc/EXCEL_TEMPLATES_GUIDE.md) - 数据格式规范
- 📓 [性能优化](doc/PERFORMANCE_OPTIMIZATION.md) - 优化策略和效果
- 📒 [索引指南](doc/DATABASE_INDEX_GUIDE.md) - 索引创建和管理
- 📜 [缓存使用](doc/CACHE_USAGE_GUIDE.md) - 缓存层使用说明

更多文档请查看 [doc/](doc/) 目录。

---

## 🔧 开发

### 本地开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器（如果有）
npm run dev

# 构建生产版本
npm run build
```

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 编写单元测试
- 添加必要的注释

### 提交代码

```bash
git add .
git commit -m "feat: 添加新功能"
git push
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 👥 作者

- **akun2019** - [GitHub](https://github.com/akun2019)

---

## 🙏 致谢

感谢以下开源项目：

- [Node.js](https://nodejs.org/) - JavaScript 运行时
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript
- [MongoDB](https://www.mongodb.com/) - NoSQL 数据库
- [Docker](https://www.docker.com/) - 容器化平台
- [抖音云开发](https://developer.open-douyin.com/) - 云平台服务

---

## 📞 联系方式

- 项目主页: https://github.com/akun2019/pangmaoReconTool
- 问题反馈: https://github.com/akun2019/pangmaoReconTool/issues

---

<div align="center">

**如果这个项目对您有帮助，请给个 ⭐ Star！**

Made with ❤️ by akun2019

</div>
