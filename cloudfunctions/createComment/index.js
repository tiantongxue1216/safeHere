// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 千问 API 配置
const QWEN_API_KEY = 'sk-67506db88c094a568731cc9074c01285' // 替换为你的阿里云千问 API Key
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

// 主函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { postId, content, voiceUrl } = event
  
  console.log('=== 收到评论请求 ===')
  console.log('postId:', postId)
  console.log('content:', content)
  console.log('voiceUrl:', voiceUrl)
  console.log('openid:', wxContext.OPENID)
  
  try {
    // 1. 评论内容审核（文字）
    if (content && content.trim()) {
      console.log('开始审核内容...')
      const auditResult = await auditCommentContent(content)
      
      console.log('审核结果:', auditResult)
      
      if (!auditResult.pass) {
        return {
          success: false,
          message: auditResult.reason || '评论不符合社区规范'
        }
      }
    } else {
      console.log('无文字内容，跳过审核')
    }
    
    // 2. 上传语音文件到云存储
    let finalVoiceUrl = ''
    if (voiceUrl) {
      console.log('开始上传语音...')
      const fileName = `comment-voice/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`
      const uploadResult = await cloud.uploadFile({
        cloudPath: fileName,
        fileContent: voiceUrl
      })
      finalVoiceUrl = uploadResult.fileID
      console.log('语音上传成功:', finalVoiceUrl)
    }
    
    // 3. 创建评论
    const userId = wxContext.OPENID
    
    console.log('开始创建评论...')
    
    // 检查是否已经存在相同的评论（避免重复提交）
    const existingComment = await db.collection('comments').where({
      postId: postId,
      userId: userId,
      content: content || '',
      createTime: db.command.gte(new Date(Date.now() - 1000)) // 1 秒内的评论
    }).get()
    
    if (existingComment.data.length > 0) {
      console.log('检测到重复评论，已存在')
      return {
        success: true,
        message: '评论已存在'
      }
    }
    
    const commentResult = await db.collection('comments').add({
      data: {
        postId: postId,
        userId: userId,
        content: content || '',
        voiceUrl: finalVoiceUrl || '',
        createTime: new Date(),
        isDeleted: false
      }
    })
    
    console.log('评论创建成功:', commentResult._id)
    
    // 4. 更新帖子的评论数
    console.log('开始更新帖子评论数...')
    await db.collection('posts').doc(postId).update({
      data: {
        commentCount: db.command.inc(1)
      }
    })
    console.log('帖子评论数更新成功')
    
    return {
      success: true,
      commentId: commentResult._id,
      message: '评论成功'
    }
    
  } catch (err) {
    console.error('创建评论失败:', err.message)
    console.error('错误堆栈:', err.stack)
    
    // 判断是否是重复键错误
    if (err.message.includes('duplicate key') || err.message.includes('唯一索引')) {
      return {
        success: false,
        message: '数据库索引配置错误，请联系管理员删除 comments 集合上的唯一索引'
      }
    }
    
    return {
      success: false,
      message: `评论失败：${err.message}`
    }
  }
}

// 评论内容审核函数（使用千问大模型）
async function auditCommentContent(text) {
  console.log('审核文本:', text)
  
  try {
    // 调用千问 API 进行评论审核 - 严格拦截可能伤害发帖人的评论
    console.log('开始调用千问 API...')
    const response = await axios.post(
      QWEN_API_URL,
      {
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: `你是一个温暖、敏感的社区评论审核员，专门保护发帖人的情感健康。你的任务是严格拦截任何可能对发帖人造成伤害的评论。

【必须拦截的评论类型】
❌ 嘲讽、讽刺、挖苦
❌ 冷漠、无视感受
❌ 说教、指责
❌ 否定情感
❌ 马后炮
❌ 轻视问题
❌ 任何可能让发帖人感到被judge、被否定、不被理解的话语

【可以通过的评论】
✅ 表达理解
✅ 给予支持
✅ 提供陪伴
✅ 简单鼓励
✅ 纯表情：🌸💪❤️🤗等温暖表情

【判断原则】
- 宁可错杀，不可放过：有疑问的评论一律拦截
- 站在发帖人角度：想象你是发帖人，看到这条评论会不会更难受
- 这是一个需要倾听和温暖的社区，不需要理性和说教

评论：${text}

请直接回复"通过"或"不通过"，不要解释。`          },
          {
            role: 'user',
            content: '请严格审核这条评论，保护发帖人的情感健康'
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${QWEN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    console.log('API 响应状态:', response.status)
    const result = response.data.choices[0].message.content.trim()
    console.log('API 返回结果:', result)
    
    // 严格判断：只有明确包含"通过"才放行
    if (result === '通过' || result.includes('可以通过') || result.includes('允许')) {
      console.log('✅ 审核通过')
      return { pass: true }
    } else {
      console.log('❌ 审核不通过:', result)
      return {
        pass: false,
        reason: result.includes('不通过') ? '评论内容可能伤害他人，请修改后重试' : result
      }
    }
    
  } catch (err) {
    console.error('评论审核 API 调用失败:', err.message)
    // 如果是网络错误或 API 不可用，暂时通过审核
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNRESET' || err.response?.status === 401) {
      console.warn('API 不可用，暂时允许评论')
      return { pass: true }
    }
    // 其他错误默认拦截
    return {
      pass: false,
      reason: '评论审核服务暂时不可用'
    }
  }
}

