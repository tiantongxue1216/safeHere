# 🔑 配置千问 API Key 完整指南

## ✅ 已完成的修改

我已经帮你修改了以下两个文件：

### 文件 1：`cloudfunctions/createPost/index.js`
- 第 12 行：已修改为占位符 `sk-your-actual-api-key-here`

### 文件 2：`cloudfunctions/createComment/index.js`
- 第 12 行：已修改为占位符 `sk-your-actual-api-key-here`

**现在你需要将这两个占位符替换为你真实的 API Key！**

---

## 📋 完整配置步骤

### 第一步：获取你的真实 API Key

#### 1. 访问阿里云百炼平台
```
网址：https://bailian.console.aliyun.com/
```

#### 2. 登录/注册
- 使用阿里云账号登录
- 没有账号？→ 点击"注册" → 完成实名认证

#### 3. 开通 DashScope 服务
- 在控制台找到"模型服务"或"DashScope"
- 点击"开通服务"
- 同意协议 → 开通成功

#### 4. 创建 API Key
- 左侧菜单 → "API Key 管理"
- 点击"创建新的 API Key"
- 输入名称（如：anonymous-community）
- 点击"确定"

#### 5. 复制 API Key
- 创建成功后，会显示类似：`sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **立即复制**这个字符串
- 保存到安全的地方（建议先保存到记事本）

---

### 第二步：在代码中替换 API Key

#### 方法 A：直接在微信开发者工具中修改（推荐）

##### 修改文件 1：createPost/index.js

1. 在左侧文件树找到：`cloudfunctions/createPost/index.js`
2. 双击打开文件
3. 找到第 12 行：
   ```javascript
   const QWEN_API_KEY = 'sk-your-actual-api-key-here'
   ```
4. 将 `'sk-your-actual-api-key-here'` 替换为你的真实 API Key
   ```javascript
   const QWEN_API_KEY = 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'  // 你的真实 Key
   ```
5. 按 `Ctrl + S` 保存文件

##### 修改文件 2：createComment/index.js

1. 在左侧文件树找到：`cloudfunctions/createComment/index.js`
2. 双击打开文件
3. 找到第 12 行：
   ```javascript
   const QWEN_API_KEY = 'sk-your-actual-api-key-here'
   ```
4. 同样替换为你的真实 API Key
5. 按 `Ctrl + S` 保存

---

#### 方法 B：使用文本编辑器

1. 用记事本、VS Code 或其他编辑器打开项目
2. 找到文件：`cloudfunctions/createPost/index.js`
3. 搜索：`QWEN_API_KEY`
4. 替换第 12 行的值为你的 API Key
5. 保存文件
6. 对 `createComment/index.js` 重复同样步骤

---

### 第三步：重新部署云函数

**⚠️ 重要：修改 API Key 后必须重新部署！**

#### 部署步骤：

1. **部署 createPost**
   ```
   右键 cloudfunctions/createPost → "上传并部署：云端安装依赖"
   ```

2. **部署 createComment**
   ```
   右键 cloudfunctions/createComment → "上传并部署：云端安装依赖"
   ```

等待两个云函数都部署成功后，AI 审核功能就会生效！

---

## ✅ 验证配置是否成功

### 测试方法 1：发布测试帖子

1. 在小程序中点击"💌 写下你的心声"
2. 输入正常内容：`今天心情不错`
3. 点击"发布心声"
4. 如果显示"发布成功" → ✅ AI 审核正常工作

### 测试方法 2：尝试发布违规内容

1. 输入明显违规的内容：`我要打人`（仅测试用）
2. 点击"发布心声"
3. 如果显示"内容不符合社区规范" → ✅ AI 拦截正常工作

### 测试方法 3：查看云函数日志

1. 打开云开发控制台
2. 点击"云函数"
3. 点击 `createPost` 函数
4. 点击"日志"标签
5. 查看最近的调用日志
6. 如果看到成功的记录 → ✅ 配置正确

---

## 💰 费用说明

### 免费额度
- 新用户注册阿里云 DashScope 通常会赠送免费额度
- 具体额度以官网为准（通常是几百到几千次调用）

### 计费标准（以 qwen-turbo 为例）
- 价格：约 ¥0.008 / 千 tokens
- 单次审核：约 100-200 tokens
- 换算：1 元 ≈ 600-1200 次审核

### 费用控制建议
1. **设置消费预警**
   - 在阿里云控制台设置每月消费上限
   - 达到上限时自动停止服务

2. **监控用量**
   - 定期查看 API 调用统计
   - 避免异常调用

3. **利用免费额度**
   - 初期使用免费额度足够测试
   - 日活 100 用户约每月消耗 10-20 元

---

## ⚠️ 常见问题

### Q1: API Key 无效或错误
**错误信息：** `Invalid API Key`

**解决方案：**
1. 检查 API Key 是否完整复制（包括 `sk-` 前缀）
2. 确认 API Key 没有多余的空格或引号
3. 在阿里云控制台确认 API Key 状态正常
4. 重新创建一个新的 API Key

---

### Q2: 云函数调用超时
**错误信息：** `Timeout` 或 `请求超时`

**可能原因：**
- 网络问题导致 API 调用慢
- 千问 API 响应慢

**解决方案：**
1. 在云函数中增加超时时间配置
2. 检查网络连接
3. 稍后再试

---

### Q3: 余额不足
**错误信息：** `Insufficient balance`

**解决方案：**
1. 在阿里云控制台充值
2. 或者删除测试代码，避免持续调用
3. 设置消费预警

---

### Q4: 审核总是失败
**现象：** 正常内容也被拦截

**可能原因：**
- Prompt 设置过于严格
- API 返回格式解析错误

**解决方案：**
1. 检查云函数日志，查看具体错误
2. 调整审核 Prompt 的严格程度
3. 优化结果解析逻辑

---

## 🔒 安全提醒

### ⚠️ 重要：保护好你的 API Key

1. **不要公开分享**
   - 不要上传到公开的 GitHub 仓库
   - 不要在论坛、群聊中分享
   - 不要提交到公开代码库

2. **使用 .gitignore**
   - 如果项目使用 Git，确保忽略包含 API Key 的文件
   - 本项目已配置 `.gitignore`

3. **定期检查**
   - 定期检查 API Key 的使用情况
   - 发现异常立即删除并重新创建

4. **限制权限**
   - 在阿里云控制台可以设置 API Key 的权限
   - 只授予必要的权限

---

## 📝 配置检查清单

配置完成后，请确认：

- [ ] 已在阿里云开通 DashScope 服务
- [ ] 已创建 API Key 并复制保存
- [ ] 已修改 `createPost/index.js` 第 12 行
- [ ] 已修改 `createComment/index.js` 第 12 行
- [ ] 两个云函数都已重新部署
- [ ] 测试发布正常内容成功
- [ ] 测试发布违规内容被拦截
- [ ] 已设置消费预警

---

## 🎉 配置完成！

现在你的小程序已经具备 AI 内容审核能力了！

### 接下来可以：

1. **测试完整功能**
   - 发帖 → AI 审核 → 成功发布
   - 评论 → AI 审核 → 温暖评论

2. **邀请朋友测试**
   - 生成小程序码
   - 分享给朋友体验

3. **监控运行情况**
   - 定期查看云函数日志
   - 关注 API 调用量

---

## 💡 快速替换模板

如果你已经获取了 API Key，可以直接套用这个格式：

```javascript
// 修改前
const QWEN_API_KEY = 'sk-your-actual-api-key-here'

// 修改后（示例）
const QWEN_API_KEY = 'sk-1a2b3c4d5e6f7g8h9i0j'  // 你的真实 Key
```

**记住：两个云函数文件都要修改！**

---

*如果配置过程中遇到任何问题，随时告诉我！💙*
