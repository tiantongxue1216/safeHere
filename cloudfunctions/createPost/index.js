// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 千问 API 配置（需要替换为你的实际密钥）
const QWEN_API_KEY = 'sk-67506db88c094a568731cc9074c01285' // 替换为你的阿里云千问 API Key
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

// 主函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { content, voiceUrl, tempVoicePath } = event
  
  try {
    // 1. 内容审核（文字）
   if (content) {
     const auditResult = await auditContent(content)
      
     if (!auditResult.pass) {
        return {
          success: false,
          message: auditResult.reason || '内容不符合社区规范'
        }
      }
    }
    
    // 2. 上传语音文件到云存储
    let finalVoiceUrl = ''
   if (tempVoicePath) {
     const fileName = `voice/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`
     const uploadResult = await cloud.uploadFile({
        cloudPath: fileName,
        fileContent: tempVoicePath
      })
      finalVoiceUrl = uploadResult.fileID
    }
    
    // 3. 创建帖子
   const userId = wxContext.OPENID
    
   const postResult = await db.collection('posts').add({
     data: {
        userId: userId,
       content: content || '',
        voiceUrl: finalVoiceUrl || voiceUrl || '',
        encourageCount: 0,
       commentCount: 0,
        createTime: new Date(),
        isDeleted: false
      }
    })
    
    return {
      success: true,
      postId: postResult._id,
      message: '发布成功'
    }
    
  } catch (err) {
   console.error('创建帖子失败:', err)
    return {
      success: false,
      message: '发布失败，请稍后重试'
    }
  }
}

// 内容审核函数（使用千问大模型）
async function auditContent(text) {
  try {
    // 调用千问 API 进行内容审核
   const response = await axios.post(
      QWEN_API_URL,
      {
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'system',
             content: `你是一个内容安全审核员。请严格判断以下内容是否包含以下违规信息：
1. 色情、淫秽、性暗示内容
2. 暴力、血腥、恐怖内容
3. 人身攻击、辱骂、歧视、恶意伤害他人的言论
4. 其他违反法律法规或社会公德的内容

如果内容违规，请明确指出违规类型和原因。
如果内容正常，请回复"通过"。

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
   if (result.includes('通过') || result.includes('正常')) {
      return { pass: true }
    } else {
      return {
        pass: false,
        reason: result
      }
    }
    
  } catch (err) {
   console.error('内容审核失败:', err)
    // 审核失败时默认拦截
    return {
      pass: false,
      reason: '内容审核服务暂时不可用'
    }
  }
}

