// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 千问 API 配置
const QWEN_API_KEY = 'sk-67506db88c094a568731cc9074c01285' // 替换为你的阿里云千问 API Key
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

// 主函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { postId, content, voiceUrl } = event
  
  try {
    // 1. 评论内容审核（文字）
  if (content) {
    const auditResult = await auditCommentContent(content)
      
    if (!auditResult.pass) {
        return {
          success: false,
          message: auditResult.reason || '评论不符合社区规范'
        }
      }
    }
    
    // 2. 上传语音文件到云存储
    let finalVoiceUrl = ''
  if (voiceUrl) {
    const fileName = `comment-voice/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`
    const uploadResult = await cloud.uploadFile({
        cloudPath: fileName,
        fileContent: voiceUrl
      })
      finalVoiceUrl = uploadResult.fileID
    }
    
    // 3. 创建评论
  const userId = wxContext.OPENID
    
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
    
    // 4. 更新帖子的评论数
   await db.collection('posts').doc(postId).update({
    data: {
       commentCount: db.command.inc(1)
      }
    })
    
    return {
      success: true,
     commentId: commentResult._id,
      message: '评论成功'
    }
    
  } catch (err) {
  console.error('创建评论失败:', err)
    return {
      success: false,
      message: '评论失败，请稍后重试'
    }
  }
}

// 评论内容审核函数（使用千问大模型）
async function auditCommentContent(text) {
  try {
    // 调用千问 API 进行评论审核 - 重点关注是否会对发帖人造成伤害
  const response = await axios.post(
      QWEN_API_URL,
      {
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'system',
            content: `你是一个温暖的社区评论审核员。请严格判断以下评论内容是否包含：
1. 对发帖人的攻击、嘲讽、贬低、否定
2. 冷漠、讽刺、风凉话等可能伤害发帖人情感的言论
3. 说教、指责、居高临下的语气
4. 任何可能让发帖人感到难受的话语
5. 色情、暴力等违规内容

这是一个需要倾听和鼓励的社区，请确保评论是温暖、支持、理解的。
如果评论有任何可能伤害发帖人的内容，请拦截。
如果评论是温暖、支持的，请回复"通过"。

请直接给出判断结果，不需要解释。`
            },
            {
              role: 'user',
            content: text
            }
          ]
        },
        parameters: {
          result_format: 'message'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${QWEN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
  const result = response.data.output.choices[0].message.content.trim()
    
    // 判断是否通过审核
  if (result.includes('通过') || result.includes('正常') || result.includes('温暖')) {
      return { pass: true }
    } else {
      return {
        pass: false,
        reason: result
      }
    }
    
  } catch (err) {
  console.error('评论审核失败:', err)
    // 审核失败时默认拦截
    return {
      pass: false,
      reason: '评论审核服务暂时不可用'
    }
  }
}

