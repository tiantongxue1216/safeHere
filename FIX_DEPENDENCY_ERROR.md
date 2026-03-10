# 🔧 修复"Cannot find module 'wx-server-sdk'"错误

## ❌ 错误原因
```
Error: Cannot find module 'wx-server-sdk'
```

这说明云函数在云端运行时，找不到必需的依赖包 `wx-server-sdk`。

**原因**：部署时没有选择"云端安装依赖"，或者依赖安装失败。

---

## ✅ 解决方案（3 种方法）

---

## 🎯 方法一：重新部署云函数（最简单）

### 步骤 1：确保 package.json 存在

检查云函数目录下有 `package.json` 文件：

```
cloudfunctions/
├── createPost/
│   ├── index.js         ✓
│   └── package.json     ✓ 必须有这个文件
└── createComment/
    ├── index.js         ✓
    └── package.json     ✓ 必须有这个文件
```

### 步骤 2：右键重新部署

**对于 createPost：**
1. 在微信开发者工具左侧文件树中
2. **右键点击** `cloudfunctions/createPost` 文件夹
3. 选择 **"上传并部署：云端安装依赖"**
   - ⚠️ 注意：一定要选"云端安装依赖"，不要只选"上传并部署"
4. 等待部署完成（约 1-2 分钟）

**对于 createComment：**
1. 同样步骤
2. **右键点击** `cloudfunctions/createComment`
3. 选择 **"上传并部署：云端安装依赖"**
4. 等待完成

### 步骤 3：验证部署成功

部署成功后，你应该看到：
- 进度条走到 100%
- 显示"部署成功"或绿色对勾 ✓
- 云函数文件夹旁边有云朵图标 ☁️

---

## 🎯 方法二：手动安装依赖后重新部署

如果方法一不行，试试这个：

### 步骤 1：在终端中打开云函数目录

1. **右键点击** `cloudfunctions/createPost`
2. 选择 **"在终端中打开"**
3. 会打开命令行窗口

### 步骤 2：安装依赖

在终端中执行：
```bash
npm install
```

等待安装完成，你会看到：
```
added X packages in Xs
```

### 步骤 3：检查 node_modules

安装完成后，云函数目录下会多出一个 `node_modules` 文件夹：
```
cloudfunctions/createPost/
├── index.js
├── package.json
└── node_modules/        ← 新生成的文件夹
    └── wx-server-sdk/
```

### 步骤 4：重新部署

1. 右键点击 `cloudfunctions/createPost`
2. 选择 **"上传并部署：云端安装依赖"**
3. 对 `createComment` 重复同样步骤

---

## 🎯 方法三：完全清理后重新部署

如果上面都不行，试试这个终极方案：

### 步骤 1：删除 node_modules

1. 在文件树中找到 `cloudfunctions/createPost/node_modules`
2. 右键点击 `node_modules` 文件夹
3. 选择"删除"

同样删除 `createComment/node_modules`

### 步骤 2：删除 package-lock.json（如果有）

如果目录中有 `package-lock.json` 文件，也删除它

### 步骤 3：重新安装依赖

对每个云函数目录执行：
```bash
# 在终端中执行
cd cloudfunctions/createPost
npm install

cd ../createComment
npm install
```

### 步骤 4：重新部署云函数

右键点击每个云函数文件夹 → "上传并部署：云端安装依赖"

---

## 📋 检查 package.json 内容

确保你的 `package.json` 包含正确的依赖：

### createPost/package.json 应该是：
```json
{
  "name": "createPost",
  "version": "1.0.0",
  "description": "创建帖子并审核内容",
  "main": "index.js",
  "dependencies": {
    "axios": "^0.21.1",
    "wx-server-sdk": "~2.6.0"
  }
}
```

### createComment/package.json 应该是：
```json
{
  "name": "createComment",
  "version": "1.0.0",
  "description": "创建评论并审核内容",
  "main": "index.js",
  "dependencies": {
    "axios": "^0.21.1",
    "wx-server-sdk": "~2.6.0"
  }
}
```

**⚠️ 如果 package.json 中没有 `wx-server-sdk`，手动添加它！**

---

## ✅ 验证修复成功

### 测试方法：

1. **在小程序中尝试发帖**
   - 点击"💌 写下你的心声"
   - 输入测试内容："测试发帖"
   - 点击"发布心声"
   - 如果成功 → ✅ 问题已解决

2. **查看控制台日志**
   - 如果看到"发布成功" → ✅ 正常
   - 没有报错 → ✅ 云函数正常工作

3. **查看云函数日志**
   - 打开云开发控制台
   - 点击"云函数"
   - 点击 `createPost`
   - 点击"日志"
   - 查看最近的调用记录
   - 应该看到成功的执行记录

---

## 💡 预防措施

### 避免再次出现这个问题：

1. **始终选择"云端安装依赖"**
   - 部署时一定要选这个选项
   - 不要只选"上传并部署"

2. **检查 package.json**
   - 每次添加新依赖时更新 package.json
   - 确保依赖列表完整

3. **定期更新依赖**
   - 运行 `npm update` 保持依赖最新
   - 但不要随意升级大版本

4. **使用统一的依赖版本**
   - 所有云函数使用相同版本的 `wx-server-sdk`
   - 建议使用 `~2.6.0` 或 `^2.6.0`

---

## 🔍 常见错误及解决方案

### 错误 1：部署时卡住不动
**原因**：网络问题或依赖太大

**解决方案**：
1. 切换网络（如手机热点）
2. 删除 node_modules 后重新安装
3. 使用国内镜像：
   ```bash
   npm config set registry https://registry.npmmirror.com
   npm install
   ```

### 错误 2：提示"权限不足"
**原因**：云环境权限设置问题

**解决方案**：
1. 在云开发控制台检查云环境
2. 确认有部署云函数的权限
3. 如果是团队项目，联系管理员

### 错误 3：部署成功但仍然报错
**原因**：云端缓存问题

**解决方案**：
1. 等待 5-10 分钟让云端缓存更新
2. 或者重新部署一次
3. 清除小程序缓存后重试

---

## 📊 完整的依赖安装流程

### 标准的部署流程应该是：

```bash
# 1. 进入云函数目录
cd cloudfunctions/createPost

# 2. 安装依赖
npm install

# 3. 验证安装
ls node_modules/wx-server-sdk

# 4. 返回微信开发者工具

# 5. 右键部署
# 右键 createPost → "上传并部署：云端安装依赖"

# 6. 等待部署完成
# 看到绿色对勾 ✓

# 7. 测试功能
# 在小程序中尝试调用云函数
```

---

## 🎉 成功标志

修复成功后，你应该能够：

- ✅ 正常发帖（文字/语音）
- ✅ AI 审核正常工作
- ✅ 看到"发布成功"提示
- ✅ 帖子出现在首页列表
- ✅ 云函数日志显示成功记录

---

## 📞 需要更多帮助？

如果尝试以上所有方法后仍然不行：

1. **查看完整的错误日志**
   - 在云开发控制台 → 云函数 → 日志
   - 复制完整的错误信息

2. **检查云函数代码**
   - 确认代码没有语法错误
   - 确认 require 语句正确

3. **告诉我具体错误**
   - 将完整的错误信息发给我
   - 我会帮你进一步分析

---

*现在试试重新部署云函数吧！💙*
