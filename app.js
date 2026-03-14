App({
  globalData: {
    userInfo: null,
    userId: null
  },

  onLaunch() {
    // 初始化云开发环境
   if (wx.cloud) {
     wx.cloud.init({
        env: 'cloud1-0gnf4ueebdb22c16', // 替换为你的云环境 ID
        traceUser: false,
        success: () => {
          // 云开发环境初始化成功后获取用户 ID
          this.initUserId()
        },
        fail: () => {
          // 云开发环境初始化失败，生成临时 ID
          this.initTempUserId()
        }
      })
    } else {
      // 当前版本不支持云开发，生成临时 ID
      this.initTempUserId()
    }
  },

  initUserId() {
    const userId = wx.getStorageSync('userId')
    if (userId) {
      this.globalData.userId = userId
    } else {
      // 调用云函数获取 OPENID
      wx.cloud.callFunction({
        name: 'login',
        success: (res) => {
          const openId = res.result.openid
          wx.setStorageSync('userId', openId)
          this.globalData.userId = openId
        },
        fail: () => {
          // 如果获取失败，生成临时 ID
          this.initTempUserId()
        }
      })
    }
  },

  initTempUserId() {
    // 生成临时 ID
    const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    wx.setStorageSync('userId', newUserId)
    this.globalData.userId = newUserId
  }
})
