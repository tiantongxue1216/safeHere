App({
  globalData: {
    userInfo: null,
    userId: null
  },

  onLaunch() {
    // 初始化云开发环境
   console.log('=== 开始初始化云开发 ===')
   console.log('环境 ID:', 'cloud1-0gnf4ueebdb22c16')
    
   if (wx.cloud) {
     wx.cloud.init({
        env: 'cloud1-0gnf4ueebdb22c16', // 替换为你的云环境 ID
        traceUser: false
      })
     console.log('✓ 云开发初始化完成！')
    } else {
     console.error('✗ 当前版本不支持云开发')
    }

    // 获取或创建用户 ID（本地存储）
    this.initUserId()
  },

  initUserId() {
    const userId = wx.getStorageSync('userId')
    if (userId) {
      this.globalData.userId = userId
    } else {
      // 生成新的用户 ID
      const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      wx.setStorageSync('userId', newUserId)
      this.globalData.userId = newUserId
    }
  }
})
