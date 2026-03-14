// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 主函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { postId, action } = event
  
  try {
    const userId = wxContext.OPENID
    
    if (action === 'add') {
      // 添加鼓励
      // 1. 检查是否已经鼓励过
      const existEncourage = await db.collection('encourages')
        .where({
          postId: postId,
          userId: userId
        })
        .get()
      
      if (existEncourage.data.length > 0) {
        return {
          success: false,
          message: '你已经鼓励过了'
        }
      }
      
      // 2. 添加鼓励记录
      await db.collection('encourages').add({
        data: {
          postId: postId,
          userId: userId,
          createTime: new Date()
        }
      })
      
      // 3. 更新帖子的鼓励数
      await db.collection('posts')
        .doc(postId)
        .update({
          data: {
            encourageCount: db.command.inc(1)
          }
        })
      
      return {
        success: true,
        message: '鼓励成功',
        action: 'added'
      }
      
    } else if (action === 'remove') {
      // 取消鼓励
      // 1. 查找鼓励记录
      const encourageRes = await db.collection('encourages')
        .where({
          postId: postId,
          userId: userId
        })
        .get()
      
      if (encourageRes.data.length === 0) {
        return {
          success: false,
          message: '没有找到鼓励记录'
        }
      }
      
      // 2. 删除鼓励记录
      await db.collection('encourages')
        .doc(encourageRes.data[0]._id)
        .remove()
      
      // 3. 更新帖子的鼓励数
      await db.collection('posts')
        .doc(postId)
        .update({
          data: {
            encourageCount: db.command.inc(-1)
          }
        })
      
      return {
        success: true,
        message: '已取消鼓励',
        action: 'removed'
      }
    }
    
    return {
      success: false,
      message: '无效的操作类型'
    }
    
  } catch (err) {
    return {
      success: false,
      message: '操作失败，请稍后重试'
    }
  }
}
