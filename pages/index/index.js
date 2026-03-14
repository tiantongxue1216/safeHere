Page({
  data: {
    posts: [],
    loading: true,
    showMyPosts: false
  },

  async onLoad() {
    // 验证数据库连接
    await this.testDatabase()
    
    this.loadPosts()
  },

  // 测试数据库连接
  async testDatabase() {
   try {
     const db = wx.cloud.database()
      
      // 尝试访问 posts 集合
     const res = await db.collection('posts').get()
      
     wx.showToast({
        title: '数据库正常',
        icon: 'success',
        duration: 1500
      })
      
      return true
    } catch(err) {
     wx.showModal({
        title: '数据库错误',
        content: '请检查是否已创建数据库集合。错误信息：' + err.errMsg,
        showCancel: false,
       confirmText: '我知道了'
      })
      
      return false
    }
  },

  onShow() {
    // 每次进入页面刷新帖子列表
    this.loadPosts()
  },

  // 加载帖子列表
  async loadPosts() {
    try {
      this.setData({ loading: true })
      
      const db = wx.cloud.database()
      const _ = db.command
      
      // 获取当前用户 ID
      const userId = getApp().globalData.userId
      
      // 查询帖子，按时间倒序
      const res = await db.collection('posts')
        .orderBy('createTime', 'desc')
        .limit(50)
        .get()
      
      // 标记哪些是自己的帖子
      const posts = res.data.map(post => ({
        ...post,
        isMine: post.userId === userId,
        createTime: this.formatTime(post.createTime)
      }))
      
      this.setData({
        posts,
        loading: false
      })
    } catch (err) {
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 跳转到发帖页
  goToPost() {
    wx.navigateTo({
      url: '/pages/post/post'
    })
  },

  // 跳转到帖子详情
  goToDetail(e) {
    const postId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${postId}`
    })
  },

  // 跳转到我的帖子
  goToMyPosts() {
    wx.navigateTo({
      url: '/pages/my-posts/my-posts'
    })
  },

  // 格式化时间
  formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
    if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
    
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
})
