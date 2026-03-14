Page({
  data: {
    posts: [],
    loading: true
  },

  onLoad() {
    this.loadMyPosts()
  },

  onShow() {
    this.loadMyPosts()
  },

  // 加载我的帖子
  async loadMyPosts() {
    try {
      this.setData({ loading: true })
      
     const userId = getApp().globalData.userId
     const db = wx.cloud.database()
      
     const res = await db.collection('posts')
        .where({
          userId: userId
        })
        .orderBy('createTime', 'desc')
        .get()
      
     const posts = res.data.map(post => ({
        ...post,
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
