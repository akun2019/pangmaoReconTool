const cloud = getApp().globalData.cloud;
const { parseJson, toastError } = require("../../utils/index");

Page({
  data: {
    category: "",

    insertedRecord: {},
    updatedRecord: "",
  },

  onLoad(options) {
    this.setData({
      category: options.category,
    });

    if (options.category === "updateRecord") {
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
            updatedRecord: parsedData.data.data,
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
    }
  },

  insertRecord() {
    const record = this.data.insertedRecord;
    if (
      !record.hasOwnProperty("sales") ||
      !record.hasOwnProperty("city") ||
      record.city === "" ||
      record.sales === ""
    ) {
      return tt.showToast({
        icon: "fail",
        title: "请填写数据",
      });
    }

    tt.showLoading({
      title: "插入中",
    });
    cloud.callContainer({
      path: "/insert_record", // 后端服务实际的调用路径
      init: {
        method: "POST",
        header: {
          "content-type": "application/json",
        },
        body: this.data.insertedRecord,
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

        tt.navigateTo({
          url: `/pages/updateRecordSuccess/updateRecordSuccess?category=${this.data.category}`,
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

  updateRecord() {
    tt.showLoading({
      title: "更新中",
    });
    cloud.callContainer({
      path: "/update_record", // 后端服务实际的调用路径
      init: {
        method: "POST",
        header: {
          "content-type": "application/json",
        },
        body: {
          data: this.data.updatedRecord,
        },
        timeout: 60000, //ms
      },
      success: ({ statusCode, data }) => {
        tt.hideLoading();
        const res = parseJson(data);
        if (statusCode !== 200) {
          return toastError(statusCode, res.error);
        }

        if (res.code !== 0) {
          return tt.showToast({
            icon: "none",
            title: res.message,
          });
        }

        tt.navigateTo({
          url: `/pages/updateRecordSuccess/updateRecordSuccess?category=${this.data.category}`,
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

  bindInsertInput(e) {
    const key = e.currentTarget.dataset.key;
    const record = this.data.insertedRecord;

    if (key === "sales") {
      record[key] = e.detail.value.trim()
        ? Number(e.detail.value)
        : e.detail.value.trim();
    } else {
      record[key] = e.detail.value.trim();
    }
    this.setData({
      insertedRecord: record,
    });
  },

  bindUpdateInput(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.updatedRecord;
    record[index].sales = Number(e.detail.value);
    this.setData({
      updatedRecord: record,
    });
  },
});
