// 对账概览页面逻辑

interface DiscrepancyType {
  type: string;
  name: string;
  count: number;
  amount: number;
  percentage: number;
  color: string;
}

Page({
  data: {
    startDate: '',
    endDate: '',
    loading: false,
    summaryData: null,
    discrepancyTypes: [] as DiscrepancyType[]
  },

  onLoad(options) {
    // 设置默认日期范围（最近7天）
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    this.setData({
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate)
    });

    // 如果有传入的summary数据，直接显示
    if (options.summary) {
      try {
        const summary = JSON.parse(decodeURIComponent(options.summary));
        this.processSummaryData(summary);
      } catch (e) {
        console.error('解析summary数据失败:', e);
      }
    } else {
      // 否则自动查询
      this.querySummary();
    }
  },

  /**
   * 开始日期改变
   */
  onStartDateChange(e) {
    this.setData({
      startDate: e.detail.value
    });
  },

  /**
   * 结束日期改变
   */
  onEndDateChange(e) {
    this.setData({
      endDate: e.detail.value
    });
  },

  /**
   * 查询概览统计
   */
  async querySummary() {
    try {
      this.setData({ loading: true });

      /* 检查云环境是否可用 */
      if (!tt.cloud || !tt.cloud.callContainer) {
        tt.showToast({
          title: '请在抖音云环境中运行',
          icon: 'none'
        });
        return;
      }

      const result = await tt.cloud.callContainer({
        path: '/get_reconciliation_summary',
        method: 'POST',
        data: {
          startDate: this.data.startDate,
          endDate: this.data.endDate
        }
      });

      if (result.data.code === 0) {
        this.processSummaryData(result.data.data);
      } else {
        throw new Error(result.data.message);
      }
    } catch (error) {
      console.error('查询失败:', error);
      tt.showToast({
        title: '查询失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 处理统计数据
   */
  processSummaryData(data) {
    // 定义差异类型配置
    const typeConfig = {
      'MISSING_CASH_FLOW': {
        name: '已核销但无流水',
        color: '#ff4d4f'
      },
      'MISSING_VERIFICATION': {
        name: '有流水但未核销',
        color: '#faad14'
      },
      'AMOUNT_MISMATCH': {
        name: '金额不一致',
        color: '#1890ff'
      },
      'DUPLICATE_VERIFICATION': {
        name: '重复核销',
        color: '#52c41a'
      }
    };

    // 计算总数用于百分比
    const totalDiscrepancies = data.summary.totalDiscrepancies;

    // 处理差异类型分布
    const discrepancyTypes: DiscrepancyType[] = [];
    
    for (const [type, config] of Object.entries(typeConfig)) {
      const breakdown = data.discrepancyBreakdown[type];
      if (breakdown && breakdown.count > 0) {
        discrepancyTypes.push({
          type,
          name: config.name,
          count: breakdown.count,
          amount: breakdown.totalAmount,
          percentage: totalDiscrepancies > 0 
            ? Math.round((breakdown.count / totalDiscrepancies) * 100) 
            : 0,
          color: config.color
        });
      }
    }

    // 按数量排序
    discrepancyTypes.sort((a, b) => b.count - a.count);

    this.setData({
      summaryData: data,
      discrepancyTypes
    });
  },

  /**
   * 查看差异清单
   */
  viewDiscrepancies() {
    tt.navigateTo({
      url: '/pages/discrepancies/discrepancies'
    });
  },

  /**
   * 导出报表
   */
  async exportReport() {
    try {
      /* 检查云环境是否可用 */
      if (!tt.cloud || !tt.cloud.callContainer) {
        tt.showToast({
          title: '请在抖音云环境中运行',
          icon: 'none'
        });
        return;
      }

      tt.showLoading({ title: '生成报表...' });

      const result = await tt.cloud.callContainer({
        path: '/export_report',
        method: 'POST',
        data: {
          startDate: this.data.startDate,
          endDate: this.data.endDate
        }
      });

      tt.hideLoading();

      if (result.data.code === 0) {
        tt.showToast({
          title: '报表已生成',
          icon: 'success'
        });
        // TODO: 实现文件下载功能
      } else {
        throw new Error(result.data.message);
      }
    } catch (error) {
      tt.hideLoading();
      console.error('导出失败:', error);
      tt.showToast({
        title: '导出失败',
        icon: 'none'
      });
    }
  },

  /**
   * 格式化日期
   */
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
});
