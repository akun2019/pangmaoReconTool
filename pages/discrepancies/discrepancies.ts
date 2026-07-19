// 差异清单页面逻辑

interface DiscrepancyItem {
  _id: string;
  order_id: string;
  store_id: string;
  store_name: string;
  discrepancy_type: string;
  expected_amount: number;
  actual_amount: number;
  difference: number;
  detected_time: string;
  status: string;
  suggestion: string;
}

interface FilterOption {
  value: string;
  label: string;
}

Page({
  data: {
    loading: false,
    discrepancyList: [] as DiscrepancyItem[],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0
    },
    // 筛选选项
    typeOptions: [
      { value: '', label: '全部类型' },
      { value: 'MISSING_CASH_FLOW', label: '已核销但无流水' },
      { value: 'MISSING_VERIFICATION', label: '有流水但未核销' },
      { value: 'AMOUNT_MISMATCH', label: '金额不一致' },
      { value: 'DUPLICATE_VERIFICATION', label: '重复核销' }
    ] as FilterOption[],
    selectedTypeIndex: 0,
    statusOptions: [
      { value: '', label: '全部状态' },
      { value: 'pending', label: '待处理' },
      { value: 'resolved', label: '已解决' },
      { value: 'ignored', label: '已忽略' }
    ] as FilterOption[],
    selectedStatusIndex: 0,
    // 当前筛选条件
    filters: {
      discrepancyType: '',
      status: ''
    }
  },

  onLoad() {
    console.log('差异清单页面加载');
    /* 检查云环境是否可用 */
    if (!tt.cloud || !tt.cloud.callContainer) {
      tt.showToast({
        title: '请在抖音云环境中运行',
        icon: 'none'
      });
      return;
    }
    this.loadDiscrepancies();
  },

  /**
   * 类型选择改变
   */
  onTypeChange(e) {
    const index = e.detail.value;
    this.setData({
      selectedTypeIndex: index,
      filters: {
        ...this.data.filters,
        discrepancyType: this.data.typeOptions[index].value
      }
    });
  },

  /**
   * 状态选择改变
   */
  onStatusChange(e) {
    const index = e.detail.value;
    this.setData({
      selectedStatusIndex: index,
      filters: {
        ...this.data.filters,
        status: this.data.statusOptions[index].value
      }
    });
  },

  /**
   * 应用筛选
   */
  applyFilter() {
    this.setData({
      'pagination.page': 1
    });
    this.loadDiscrepancies();
  },

  /**
   * 加载差异列表
   */
  async loadDiscrepancies() {
    try {
      /* 检查云环境是否可用 */
      if (!tt.cloud || !tt.cloud.callContainer) {
        tt.showToast({
          title: '请在抖音云环境中运行',
          icon: 'none'
        });
        return;
      }

      this.setData({ loading: true });

      const params: any = {
        page: this.data.pagination.page,
        pageSize: this.data.pagination.pageSize
      };

      // 添加筛选条件
      if (this.data.filters.discrepancyType) {
        params.discrepancyType = this.data.filters.discrepancyType;
      }

      if (this.data.filters.status) {
        params.status = this.data.filters.status;
      }

      const result = await tt.cloud.callContainer({
        path: '/get_discrepancy_list',
        method: 'POST',
        data: params
      });

      if (result.data.code === 0) {
        this.setData({
          discrepancyList: result.data.data.list,
          pagination: result.data.data.pagination
        });
      } else {
        throw new Error(result.data.message);
      }
    } catch (error) {
      console.error('加载失败:', error);
      tt.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 上一页
   */
  prevPage() {
    if (this.data.pagination.page > 1) {
      this.setData({
        'pagination.page': this.data.pagination.page - 1
      });
      this.loadDiscrepancies();
    }
  },

  /**
   * 下一页
   */
  nextPage() {
    if (this.data.pagination.page < this.data.pagination.totalPages) {
      this.setData({
        'pagination.page': this.data.pagination.page + 1
      });
      this.loadDiscrepancies();
    }
  },

  /**
   * 显示详情
   */
  showDetail(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.discrepancyList.find(d => d._id === id);
    
    if (item) {
      tt.showModal({
        title: '差异详情',
        content: `订单号：${item.order_id}\n门店：${item.store_name}\n类型：${this.getTypeName(item.discrepancy_type)}\n预期金额：¥${item.expected_amount}\n实际金额：¥${item.actual_amount}\n差额：¥${item.difference}\n建议：${item.suggestion}`,
        showCancel: false
      });
    }
  },

  /**
   * 获取类型名称
   */
  getTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'MISSING_CASH_FLOW': '已核销但无流水',
      'MISSING_VERIFICATION': '有流水但未核销',
      'AMOUNT_MISMATCH': '金额不一致',
      'DUPLICATE_VERIFICATION': '重复核销'
    };
    return typeMap[type] || type;
  },

  /**
   * 获取状态文本
   */
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': '待处理',
      'resolved': '已解决',
      'ignored': '已忽略'
    };
    return statusMap[status] || status;
  },

  /**
   * 格式化时间
   */
  formatTime(timeStr: string): string {
    const date = new Date(timeStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
});
