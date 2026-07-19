// 数据导入页面逻辑

Page({
  data: {
    dataType: 'orders', // orders | verification | cash_flow
    uploading: false,
    progress: 0,
    progressText: '',
    importResult: null,
    canReconcile: false,
    currentBatchNo: ''
  },

  /**
   * 选择数据类型
   */
  selectDataType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      dataType: type,
      importResult: null,
      canReconcile: false
    });
  },

  /**
   * 选择文件
   */
  async chooseFile() {
    try {
      // 选择文件
      const res = await tt.chooseMessageFile({
        count: 1,
        type: 'file',
        extension: ['xlsx', 'xls', 'csv']
      });

      if (res.tempFiles && res.tempFiles.length > 0) {
        const file = res.tempFiles[0];
        console.log('选择的文件:', file);
        
        // 读取文件内容为 base64
        this.setData({
          uploading: true,
          progress: 10,
          progressText: '正在读取文件...'
        });

        const fileContent = await this.readFileAsBase64(file.path);
        
        // 上传文件
        await this.uploadFile(file.name, fileContent);
      }
    } catch (error) {
      console.error('选择文件失败:', error);
      tt.showToast({
        title: '选择文件失败',
        icon: 'none'
      });
      this.setData({ uploading: false });
    }
  },

  /**
   * 读取文件为 Base64
   */
  readFileAsBase64(filePath) {
    return new Promise((resolve, reject) => {
      tt.getFileSystemManager().readFile({
        filePath: filePath,
        encoding: 'base64',
        success: (res) => {
          resolve(res.data);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  /**
   * 上传文件到云存储
   */
  async uploadFile(fileName, fileContent) {
    try {
      /* 检查云环境是否可用 */
      if (!tt.cloud || !tt.cloud.callContainer) {
        tt.showToast({
          title: '请在抖音云环境中运行',
          icon: 'none'
        });
        this.setData({ uploading: false });
        return;
      }

      this.setData({
        progress: 30,
        progressText: '正在上传文件...'
      });

      const result = await tt.cloud.callContainer({
        path: '/upload_file',
        method: 'POST',
        data: {
          fileName: fileName,
          fileContent: fileContent,
          dataType: this.data.dataType
        }
      });

      if (result.data.code === 0) {
        console.log('文件上传成功:', result.data.data);
        this.setData({
          progress: 50,
          progressText: '文件上传成功，开始解析...',
          currentBatchNo: result.data.data.batchNo
        });

        // 开始解析导入
        await this.importData(result.data.data.batchNo, result.data.data.fileId);
      } else {
        throw new Error(result.data.message);
      }
    } catch (error) {
      console.error('上传失败:', error);
      tt.showToast({
        title: '上传失败',
        icon: 'none'
      });
      this.setData({ uploading: false });
    }
  },

  /**
   * 解析并导入数据
   */
  async importData(batchNo, fileId) {
    try {
      /* 检查云环境是否可用 */
      if (!tt.cloud || !tt.cloud.callContainer) {
        tt.showToast({
          title: '请在抖音云环境中运行',
          icon: 'none'
        });
        this.setData({ uploading: false });
        return;
      }

      this.setData({
        progress: 70,
        progressText: '正在解析数据...'
      });

      // 根据数据类型调用不同的云函数
      let importPath;
      switch (this.data.dataType) {
        case 'orders':
          importPath = '/parse_and_import_orders';
          break;
        case 'verification':
          importPath = '/parse_and_import_verifications';
          break;
        case 'cash_flow':
          importPath = '/parse_and_import_cashflows';
          break;
        default:
          throw new Error('未知的数据类型');
      }

      const result = await tt.cloud.callContainer({
        path: importPath,
        method: 'POST',
        data: {
          batchNo: batchNo,
          fileId: fileId
        }
      });

      this.setData({
        progress: 100,
        progressText: '导入完成'
      });

      if (result.data.code === 0) {
        console.log('导入成功:', result.data.data);
        this.setData({
          importing: false,
          importResult: result.data.data,
          canReconcile: result.data.data.successRecords > 0
        });

        tt.showToast({
          title: '导入成功',
          icon: 'success'
        });

        // 3秒后隐藏进度条
        setTimeout(() => {
          this.setData({
            uploading: false,
            progress: 0
          });
        }, 3000);
      } else {
        throw new Error(result.data.message);
      }
    } catch (error) {
      console.error('导入失败:', error);
      tt.showToast({
        title: '导入失败',
        icon: 'none'
      });
      this.setData({ uploading: false });
    }
  },

  /**
   * 执行对账
   */
  async runReconciliation() {
    try {
      /* 检查云环境是否可用 */
      if (!tt.cloud || !tt.cloud.callContainer) {
        tt.showToast({
          title: '请在抖音云环境中运行',
          icon: 'none'
        });
        return;
      }

      tt.showLoading({ title: '对账中...' });

      // 获取最近7天的日期范围
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const result = await tt.cloud.callContainer({
        path: '/run_reconciliation',
        method: 'POST',
        data: {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate)
        }
      });

      tt.hideLoading();

      if (result.data.code === 0) {
        console.log('对账完成:', result.data.data);
        
        // 跳转到对账概览页面
        tt.navigateTo({
          url: `/pages/dashboard/dashboard?summary=${encodeURIComponent(JSON.stringify(result.data.data))}`
        });
      } else {
        throw new Error(result.data.message);
      }
    } catch (error) {
      tt.hideLoading();
      console.error('对账失败:', error);
      tt.showToast({
        title: '对账失败',
        icon: 'none'
      });
    }
  },

  /**
   * 查看导入历史
   */
  viewImportHistory() {
    tt.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  /**
   * 格式化日期
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  onLoad() {
    console.log('数据导入页面加载');
  }
});
