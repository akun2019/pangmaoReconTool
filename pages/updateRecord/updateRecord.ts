const cloud = getApp().globalData.cloud;
const { parseJson, toastError } = require("../../utils/index");

Page({
  data: {
    haveGetRecord: false,
    record: "",

    category: "",
  },

  onLoad(options) {
    this.setData({
      category: options.category,
    });
  },

  onShow() {
    tt.showLoading({
      title: "加载中",
    });
    cloud.callContainer({
      path: "/select_record", // 后端服务实际的调用路径
      init: {
        method: "GET",
        timeout: 60000, //ms
      },
      success: ({ statusCode, data }) => {
        tt.hideLoading();
        const parsedData = parseJson(data);
        if (statusCode !== 200) {
          return toastError(statusCode, parsedData.error);
        }
        if (parsedData.code !== 0) {
          return tt.showToast({
            icon: "none",
            title: parsedData.message,
          });
        }
        this.setData({
          record: parsedData.data.data,
        });
      },
      fail: (response) => {
        tt.hideLoading();
        if (response.errMsg && response.errMsg.includes("route info not found")) {
          return tt.showToast({
            icon: "none",
            title: "路径不存在，请检查",
          });
        }
        if (response.errMsg && response.errMsg.includes("小程序和环境不匹配")) {
          return tt.showToast({
            icon: "none",
            title: "请在抖音云环境中运行",
          });
        }
        tt.showToast({
          icon: "none",
          title: "网络请求失败，请稍后重试",
        });
      },
    });
  },

  insertRecord() {
    tt.navigateTo({
      url: `/pages/updateRecordResult/updateRecordResult?category=${this.data.category}`,
    });
  },

  updateRecord() {
    tt.navigateTo({
      url: `/pages/updateRecordResult/updateRecordResult?category=${this.data.category}`,
    });
  },
});
