// 评论审核器 - 独立模块
const axios = require('axios');

// 豆包 API 配置（已注释）
// const DOBAO_API_KEY = '472b9abf-1cc6-46bf-ab79-20d79ce31103'; // 豆包 API Key
// const DOBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
// const DOBAO_MODEL = 'Doubao-Seed-2.0-pro';

// 千问 API 配置
const QWEN_API_KEY = 'sk-67506db88c094a568731cc9074c01285'; // 阿里云千问 API Key
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const QWEN_MODEL = 'qwen-plus';

// 敏感词库（根据实际运营情况持续优化）
const SENSITIVE_WORDS = {
  // 硬拦截敏感词（直接拦截）
  hardBlock: [
    '傻逼', 'SB', '废物', '垃圾', '去死', '他妈', '操你妈',
    '自杀', '自残', '跳楼', '割腕',
    '微信', 'QQ', '电话', '加我', '私信', '联系方式',
    'http://', 'https://', 'www.', '.com', '.cn'
  ],
  
  // 高风险触发词（进入大模型审核）
  highRisk: [
    '活该', '矫情', '玻璃心', '想太多', '太脆弱', '至于吗', '至于嘛',
    '早跟你说过', '早就说了', '谁让你', '你自己选的',
    '这有什么', '没什么大不了', '这很正常', '大家都这样',
    '比你惨的多了', '你这算什么', '小事情', '别装了',
    '你应该', '你不应该', '你要坚强', '想开点', '看开点',
    '以后别发', '让人看了心烦', '别发这种内容', '别发这种帖子'
  ],
  
  // 白名单词（可直接放行）
  whitelist: [
    '抱抱', '加油', '支持', '理解', '陪伴', '倾听',
    '会好的', '会好起来的', '我懂你', '我在', '随时找我',
    '🌸', '💪', '❤️', '🤗', '😊', '✨', '🌟'
  ]
};

/**
 * 检查文本是否包含指定敏感词列表中的词
 * @param {string} text - 要检查的文本
 * @param {string[]} wordList - 敏感词列表
 * @returns {boolean} 是否包含敏感词
 */
function containsSensitiveWords(text, wordList) {
  return wordList.some(word => text.includes(word));
}

/**
 * 第一层：前置合规过滤层
 * @param {string} text - 评论文本
 * @returns {object} 过滤结果
 */
exports.preFilterComment = function preFilterComment(text) {
  const trimmedText = text.trim();
  
  // 1. 检查硬拦截敏感词
  if (containsSensitiveWords(trimmedText, SENSITIVE_WORDS.hardBlock)) {
    return {
      action: 'block',
      reason: '包含不当内容',
      rule: 'hard-block'
    };
  }
  
  // 2. 检查白名单词和高风险词
  const hasWhitelist = containsSensitiveWords(trimmedText, SENSITIVE_WORDS.whitelist);
  const hasHighRisk = containsSensitiveWords(trimmedText, SENSITIVE_WORDS.highRisk);
  
  // 仅包含白名单词，直接放行
  if (hasWhitelist && !hasHighRisk) {
    return {
      action: 'pass',
      rule: 'whitelist'
    };
  }
  
  // 3. 基础规则快速过滤
  
  // 纯表情/纯标点，直接放行
  if (/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\p{P}]+$/u.test(trimmedText)) {
    return {
      action: 'pass',
      rule: 'emoji-punctuation'
    };
  }
  
  // 超短内容（1-2 个字符），无风险，直接放行
  if (trimmedText.length <= 2 && !hasHighRisk) {
    return {
      action: 'pass',
      rule: 'short-text'
    };
  }
  
  // 4. 检查高风险触发词，进入大模型审核
  if (hasHighRisk) {
    return {
      action: 'review',
      rule: 'high-risk-trigger'
    };
  }
  
  // 5. 其他情况进入大模型审核
  return {
    action: 'review',
    rule: 'default-review'
  };
};

/**
 * 构建豆包 API 审核请求消息
 * @param {string} commentText - 评论文本
 * @param {string} postContent - 帖子内容
 * @returns {object[]} API 请求消息
 */
function buildAuditMessages(commentText, postContent) {
  return [
    {
      role: 'system',
      content: `你是匿名倾听社区的专属内容安全审核员。社区核心是为有情绪倾诉需求的用户提供安全、包容的树洞。

【你的职责】
1. 精准拦截会对发帖人造成伤害、违法违规、不良导向的评论
2. 绝对不能误拦截共情安慰、理性陪伴、温和建议的友好评论
3. 优先保障用户体验，边界争议内容一律不拦截

【输入内容】
- 发帖人倾诉原文：${postContent || '暂无'}
- 用户评论内容：${commentText}

【审核规则 - 优先级 1：必须拦截】
1. 违法违规：涉政敏感、色情低俗、暴力血腥、违法犯罪引导
2. 人身攻击：辱骂、诅咒、阴阳怪气、嘲讽、人格否定
3. 二次伤害：否定情绪、指责受害者、洗白施害者（如「活该」「矫情」「谁让你自己选的」）
4. 高危引导：诱导自残、自杀、报复社会
5. 隐私引流：索要隐私、广告、引流外站、联系方式、刷屏
6. 歧视引战：性别/地域/疾病歧视，挑起群体对立

【审核规则 - 优先级 2：必须放行】
1. 共情安慰：表达共情、安慰、关心、支持、鼓励
2. 同频陪伴：分享相似经历、陪伴倾诉，无攻击否定
3. 温和建议：不带指责、不说教，仅给温和理性建议
4. 中性内容：纯表情、纯标点、无不良导向的简短回应

【审核规则 - 优先级 3：边界内容】
1. 轻微争议但无恶意：优先放行
2. 无法明确判断：人工复核，不拦截
3. 禁止将带有负面情绪的共情内容判定为拦截

【输出要求】
请严格按照以下 JSON 格式输出：
{
  "审核结果": "拦截/放行/人工复核",
  "命中规则": "优先级 1-3 / 优先级 2-1 等",
  "判定原因": "简短说明，不超过 30 字",
  "置信度": 0-100
}

示例 1（放行）：
评论："抱抱你，会好起来的"
输出：{"审核结果":"放行","命中规则":"优先级 2-1","判定原因":"表达共情安慰","置信度":98}

示例 2（拦截）：
评论："这有什么好难过的，你想太多了"
输出：{"审核结果":"拦截","命中规则":"优先级 1-3","判定原因":"否定情绪，二次伤害","置信度":96}

示例 3（边界放行）：
评论："我理解你的感受，不过也许可以换个角度想"
输出：{"审核结果":"放行","命中规则":"优先级 3-1","判定原因":"温和建议，无恶意","置信度":85}

请审核以上评论。`
    },
    {
      role: 'user',
      content: '请根据社区规则审核这条评论，确保不伤害发帖人'
    }
  ];
}

/**
 * 第二层：大模型精准审核层
 * @param {string} commentText - 评论文本
 * @param {string} postId - 帖子 ID（用于获取上下文）
 * @param {object} db - 数据库实例（可选）
 * @returns {object} 审核结果
 */
exports.auditCommentWithAI = async function auditCommentWithAI(commentText, postId, db = null) {
  try {
      // 获取发帖原文（用于上下文理解）
      let postContent = '';
      if (db && postId) {
        try {
          const postRes = await db.collection('posts').doc(postId).get();
          postContent = postRes.data.content || '';
        } catch (err) {
          // 静默处理获取发帖原文失败的情况
        }
      }
    
    // 调用千问 API 进行场景化精准审核
    const response = await axios.post(
      QWEN_API_URL,
      {
        model: QWEN_MODEL,
        messages: buildAuditMessages(commentText, postContent)
      },
      {
        headers: {
          'Authorization': `Bearer ${QWEN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = response.data.choices[0].message.content.trim();
    
    // 解析 JSON 结果
    try {
      const auditData = JSON.parse(result);
      const { '审核结果': auditResult, '置信度': confidence, '判定原因': reason } = auditData;
      
      console.log('解析结果:', auditResult, '置信度:', confidence);
      
      // 仅当审核结果=拦截 且 置信度≥95 时，才执行拦截
      if (auditResult === '拦截' && confidence >= 95) {
        console.log('❌ AI 审核拦截（高置信度）:', reason);
        return {
          pass: false,
          reason: reason || '评论内容可能伤害他人'
        };
      }
      
      // 置信度 90-94 的拦截，进入人工复核，先放行
      if (auditResult === '拦截' && confidence >= 90 && confidence < 95) {
        console.log('⚠️ AI 审核拦截（中置信度），进入人工复核，先放行');
        return { pass: true };
      }
      
      // 放行或人工复核，都放行
      if (auditResult === '放行' || auditResult === '人工复核') {
        console.log('✅ AI 审核放行:', reason);
        return { pass: true };
      }
      
      // 默认放行
      console.log('✅ 默认放行');
      return { pass: true };
      
    } catch (parseErr) {
      console.error('解析 AI 结果失败:', parseErr.message);
      // 解析失败时，默认放行（防误拦）
      console.warn('AI 结果解析失败，默认放行');
      return { pass: true };
    }
    
  } catch (err) {
    console.error('AI 审核 API 调用失败:', err.message);
    // API 不可用时，返回审核失败，避免有害评论通过
    console.warn('AI 服务不可用，审核失败');
    return { pass: false, reason: '评论审核失败，请稍后重试' };
  }
};

/**
 * 完整的评论审核流程
 * @param {string} commentText - 评论文本
 * @param {string} postId - 帖子 ID
 * @param {object} db - 数据库实例
 * @returns {object} 最终审核结果
 */
exports.auditComment = async function auditComment(commentText, postId, db = null) {
  if (!commentText || !commentText.trim()) {
    return { pass: true, reason: '无内容，跳过审核' };
  }
  
  // 前置过滤
  const preResult = exports.preFilterComment(commentText);
  
  // 硬拦截
  if (preResult.action === 'block') {
    return { pass: false, reason: preResult.reason };
  }
  
  // 直接放行
  if (preResult.action === 'pass') {
    return { pass: true };
  }
  
  // AI 审核
  if (preResult.action === 'review') {
    return await exports.auditCommentWithAI(commentText, postId, db);
  }
  
  // 默认放行
  return { pass: true };
};