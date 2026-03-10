Page({
  data: {
   content: '',
    voiceUrl: '',
    isRecording: false,
    recordingTime: 0,
    tempVoicePath: '',
    emojiList: ['💙', '💜', '💚', '💛', '❤️', '🧡', '😊', '😢', '😔', '😭', '🥺', '✨', '🌟', '⭐', '🌈', '☀️', '🌙', '🍀', '🌸', '🌺'],
    selectedEmoji: ''
  },

  recorderManager: null,

  onLoad() {
    // 获取录音管理器
    this.recorderManager = wx.getRecorderManager()
    
    // 监听录音事件
    this.recorderManager.onStart(() => {
     console.log('录音开始')
    })

    this.recorderManager.onPause(() => {
     console.log('录音暂停')
    })

    this.recorderManager.onResume(() => {
     console.log('录音恢复')
    })

    this.recorderManager.onStop((res) => {
     console.log('录音结束', res)
      this.setData({
        tempVoicePath: res.tempFilePath,
        voiceUrl: res.tempFilePath
      })
     wx.showToast({
        title: '录音完成',
        icon: 'success'
      })
    })

    this.recorderManager.onError((err) => {
     console.error('录音错误:', err)
     wx.showToast({
        title: '录音失败',
        icon: 'none'
      })
    })
  },

  // 输入内容
  onContentInput(e) {
    this.setData({
     content: e.detail.value
    })
  },

  // 开始录音
  startRecord() {
    this.setData({
      isRecording: true,
      recordingTime: 0
    })

    // 开始录音
    this.recorderManager.start({
      duration: 60000, // 最长 60 秒
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
     format: 'mp3'
    })

    // 计时器
   const timer = setInterval(() => {
     if (!this.data.isRecording) {
        clearInterval(timer)
        return
      }
      this.setData({
        recordingTime: this.data.recordingTime + 1
      })
    }, 1000)

    this.timer = timer
  },

  // 停止录音
  stopRecord() {
    this.setData({
      isRecording: false
    })
    
   if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    // 停止录音
    this.recorderManager.stop()
  },

  // 删除语音
  deleteVoice() {
    this.setData({
      voiceUrl: '',
      tempVoicePath: ''
    })
  },

  // 选择表情
  selectEmoji(e) {
   const emoji = e.currentTarget.dataset.emoji
   const currentContent = this.data.content
    
    // 在光标位置插入表情，如果没有内容就直接添加
   const newContent = currentContent + emoji
    this.setData({
     content: newContent,
      selectedEmoji: emoji
    })
  },

  // 提交帖子
  async submitPost() {
   const { content, voiceUrl, tempVoicePath } = this.data

   if (!content && !voiceUrl) {
     wx.showToast({
        title: '请输入内容或录制语音',
        icon: 'none'
      })
      return
    }

    try {
     wx.showLoading({
        title: '发布中...',
        mask: true
      })

      // 调用云函数进行内容审核和发布
     const result = await wx.cloud.callFunction({
        name: 'createPost',
       data: {
         content: content,
          voiceUrl: voiceUrl,
          tempVoicePath: tempVoicePath
        }
      })

     wx.hideLoading()

     if (result.result.success) {
       wx.showToast({
          title: '发布成功',
          icon: 'success'
        })
        
        // 延迟返回首页
        setTimeout(() => {
         wx.navigateBack()
        }, 1500)
      } else {
       wx.showToast({
          title: result.result.message || '发布失败',
          icon: 'none'
        })
      }
    } catch (err) {
     console.error('发布失败:', err)
     wx.hideLoading()
     wx.showToast({
        title: '发布失败，请重试',
        icon: 'none'
      })
    }
  }
})
