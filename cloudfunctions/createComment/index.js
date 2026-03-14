// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 导入评论审核模块
const commentAuditor = require('./comment-auditor')

// 主函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { postId, content, voiceUrl } = event
  

  
  try {
    // 1. 评论审核
    if (content && content.trim()) {
      try {
        // 设置审核超时限制
        const auditPromise = commentAuditor.auditComment(content, postId, db);
        const auditResult = await Promise.race([
          auditPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('审核超时')), 3500))
        ]);
        
        // 审核不通过
        if (!auditResult.pass) {
          return {
            success: false,
            message: auditResult.reason || '评论内容不符合社区规范'
          }
        }
      } catch (auditError) {
        // 审核失败时返回错误，避免因审核问题导致有害评论通过
        return {
          success: false,
          message: '评论审核失败，请稍后重试'
        };
      }
    }
    
    // 2. 上传语音文件到云存储
    let finalVoiceUrl = ''
    if (voiceUrl) {
      try {
        // 设置上传超时限制
        const uploadPromise = cloud.uploadFile({
          cloudPath: `comment-voice/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`,
          fileContent: voiceUrl
        });
        const uploadResult = await Promise.race([
          uploadPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('上传超时')), 2000))
        ]);
        finalVoiceUrl = uploadResult.fileID
      } catch (uploadError) {
        // 上传失败时继续执行，不阻止评论发布
      }
    }
    
    // 3. 创建评论
    const userId = wxContext.OPENID
    
    // 检查是否已经存在相同的评论（避免重复提交）
    try {
      const existingComment = await db.collection('comments').where({
        postId: postId,
        userId: userId,
        content: content || '',
        createTime: db.command.gte(new Date(Date.now() - 1000)) // 1 秒内的评论
      }).get()
      
      if (existingComment.data.length > 0) {
        return {
          success: true,
          message: '评论已存在'
        }
      }
      
      // 创建评论
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
    } catch (dbError) {
      console.error('数据库操作失败:', dbError.message);
      // 数据库操作失败时，返回错误信息
      return {
        success: false,
        message: `数据库操作失败：${dbError.message}`
      };
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



