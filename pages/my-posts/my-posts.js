Page({
  data: {
    posts: [],
    loading: true
  },

  onLoad() {
    this.checkUserIdAndLoadPosts()
  },

  onShow() {
    this.checkUserIdAndLoadPosts()
  },

  // 检查userId并加载帖子
  checkUserIdAndLoadPosts() {
    const userId = getApp().globalData.userId
    if (userId) {
      this.loadMyPosts()
    } else {
      // 等待userId获取
      setTimeout(() => {
        this.checkUserIdAndLoadPosts()
      }, 100)
    }
  },

  // 加载我的帖子
  async loadMyPosts() {
    try {
      this.setData({ loading: true })
      
     const userId = getApp().globalData.userId
     const db = wx.cloud.database()
     
     // 调试信息
     console.log('当前用户ID:', userId)
     
     // 先获取所有帖子，看看数据库中有什么
     const allPosts = await db.collection('posts').get()
     console.log('所有帖子:', allPosts.data)
     
     // 然后获取当前用户的帖子
     const res = await db.collection('posts')
        .where({
          userId: userId
        })
        .orderBy('createTime', 'desc')
        .get()
     
     console.log('当前用户的帖子:', res.data)
      
     const posts = res.data.map(post => ({
        ...post,
        createTime: this.formatTime(post.createTime)
      }))
      
      this.setData({
        posts,
        loading: false
      })
    } catch (err) {
     console.error('加载帖子失败:', err)
     wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  goToPost() {
   wx.navigateTo({
      url: '/pages/post/post'
    })
  },

  goToDetail(e) {
   const postId = e.currentTarget.dataset.id
   wx.navigateTo({
      url: `/pages/detail/detail?id=${postId}`
    })
  },

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
