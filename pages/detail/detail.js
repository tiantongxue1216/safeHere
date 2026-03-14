Page({
  data: {
   postId: '',
    post: null,
   comments: [],
   commentContent: '',
    tempCommentVoicePath: '',
    isRecordingComment: false,
    isPlaying: false,
    playingCommentId: null,
    hasEncouraged: false,
    audioContext: null
  },

  onLoad(options) {
  const postId = options.id
    this.setData({ postId })
    
    // 获取音频上下文
    this.data.audioContext = wx.createInnerAudioContext()
    
    // 监听音频事件
    this.data.audioContext.onEnded(() => {
      this.setData({
        isPlaying: false,
        playingCommentId: null
      })
    })

    this.loadPostDetail()
    this.loadComments()
  },

  onUnload() {
  if (this.data.audioContext) {
      this.data.audioContext.destroy()
    }
  },

  // 加载帖子详情
  async loadPostDetail() {
    try {
    const db = wx.cloud.database()
    const userId = getApp().globalData.userId
      
    const res = await db.collection('posts')
        .doc(this.data.postId)
        .get()
      
    const post = res.data
      post.createTime = this.formatTime(post.createTime)
      post.isMine = post.userId === userId
      
      // 检查是否已经鼓励过
    const encourageRes = await db.collection('encourages')
        .where({
          postId: this.data.postId,
          userId: userId
        })
        .get()
      
      this.setData({
        post,
        hasEncouraged: encourageRes.data.length > 0
      })
    } catch (err) {
    wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  // 加载评论
  async loadComments() {
    try {
      const db = wx.cloud.database()
      
      const res = await db.collection('comments')
        .where({
          postId: this.data.postId
        })
        .orderBy('createTime', 'asc')
        .get()
      
      const comments = res.data.map(comment => ({
        ...comment,
        createTime: this.formatTime(comment.createTime)
      }))
      
      this.setData({ comments })
    } catch (err) {
      wx.showToast({
        title: '加载评论失败',
        icon: 'none'
      })
    }
  },

  // 切换鼓励状态（使用云函数）
  async toggleEncourage() {
    const { hasEncouraged, post } = this.data
    
    try {
      wx.showLoading({
        title: '处理中...',
        mask: true
      })
      
      // 调用云函数处理鼓励
      const result = await wx.cloud.callFunction({
        name: 'toggleEncourage',
        data: {
          postId: this.data.postId,
          action: hasEncouraged ? 'remove' : 'add'
        }
      })
      
      wx.hideLoading()
      
      if (result.result.success) {
        const { action } = result.result
        
        if (action === 'added') {
          // 添加鼓励成功
          this.setData({
            hasEncouraged: true,
            post: {
              ...post,
              encourageCount: (post.encourageCount || 0) + 1
            }
          })
          
          // 播放鼓励动画效果
          wx.vibrateShort({
            type: 'light'
          })
          
          wx.showToast({
            title: '鼓励成功',
            icon: 'success'
          })
        } else if (action === 'removed') {
          // 取消鼓励成功
          this.setData({
            hasEncouraged: false,
            post: {
              ...post,
              encourageCount: Math.max(0, (post.encourageCount || 0) - 1)
            }
          })
          
          wx.showToast({
            title: '已取消鼓励',
            icon: 'none'
          })
        }
      } else {
        wx.showToast({
          title: result.result.message || '操作失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: '操作失败，请稍后重试',
        icon: 'none'
      })
    }
  },

  // 播放/暂停语音
  togglePlayVoice() {
  const { post, isPlaying } = this.data
    
  if (!post.voiceUrl) return
    
  if (isPlaying) {
      this.data.audioContext.pause()
      this.setData({ isPlaying: false })
    } else {
     this.data.audioContext.src = post.voiceUrl
      this.data.audioContext.play()
      this.setData({ isPlaying: true })
    }
  },

  // 播放评论语音
  togglePlayCommentVoice(e) {
  const commentId = e.currentTarget.dataset.id
  const comment = this.data.comments.find(c => c._id === commentId)
    
  if (!comment || !comment.voiceUrl) return
    
  const { playingCommentId, isPlaying } = this.data
    
  if (playingCommentId === commentId && isPlaying) {
      this.data.audioContext.pause()
      this.setData({ isPlaying: false })
    } else {
     this.data.audioContext.src = comment.voiceUrl
      this.data.audioContext.play()
      this.setData({
        isPlaying: true,
        playingCommentId: commentId
      })
    }
  },

  // 输入评论内容
  onCommentInput(e) {
    this.setData({
    commentContent: e.detail.value
    })
  },

  // 开始录制评论语音
  startRecordComment() {
    this.setData({
      isRecordingComment: true
    })
    
  if (!this.recorderManager) {
      this.recorderManager = wx.getRecorderManager()
      
      this.recorderManager.onStop((res) => {
        this.setData({
          tempCommentVoicePath: res.tempFilePath
        })
      wx.showToast({
          title: '录音完成',
          icon: 'success'
        })
      })
    }
    
    this.recorderManager.start({
      duration: 30000,
    format: 'mp3'
    })
  },

  // 停止录制评论语音
  stopRecordComment() {
    this.setData({
      isRecordingComment: false
    })
    
  if (this.recorderManager) {
      this.recorderManager.stop()
    }
  },

  // 提交评论
  async submitComment() {
    const { commentContent, tempCommentVoicePath } = this.data
    
    try {
      wx.showLoading({
        title: '发送中...',
        mask: true
      })

      // 调用云函数创建评论
      const result = await wx.cloud.callFunction({
        name: 'createComment',
        data: {
          postId: this.data.postId,
          content: commentContent,
          voiceUrl: tempCommentVoicePath
        }
      })

      wx.hideLoading()

      if (result.result.success) {
        wx.showToast({
          title: '评论成功',
          icon: 'success'
        })
        
        this.setData({
          commentContent: '',
          tempCommentVoicePath: ''
        })
        
        await this.loadComments()
      } else {
        wx.showToast({
          title: result.result.message || '评论失败',
          icon: 'none'
        })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({
        title: '评论失败，请重试',
        icon: 'none'
      })
    }
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
