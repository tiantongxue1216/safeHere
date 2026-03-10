# 项目配置清单 ✅

## 必须修改的配置项

在运行项目前，请务必修改以下配置：

### 1. AppID 配置
**文件位置**: `project.config.json`  
**修改内容**: 
```json
{
  "appid": "你的小程序 AppID"  // 替换为真实 AppID
}
```

**获取方式**: 微信公众平台 → 开发管理 → 开发设置

---

### 2. 云环境 ID 配置
**文件位置**: `app.js` 第 9 行  
**修改内容**:
```javascript
wx.cloud.init({
  env: 'your-cloud-env-id', // 替换为你的云环境 ID
  traceUser: false
})
```

**获取方式**: 微信开发者工具 → 云开发 → 环境列表

---

### 3. 千问 API Key 配置（重要！）

#### 文件 1: `cloudfunctions/createPost/index.js` 第 12 行
```javascript
const QWEN_API_KEY = 'YOUR_QWEN_API_KEY' // 替换为你的阿里云千问 API Key
```

#### 文件 2: `cloudfunctions/createComment/index.js` 第 13 行
```javascript
const QWEN_API_KEY = 'YOUR_QWEN_API_KEY' // 替换为你的阿里云千问 API Key
```

**获取方式**: 阿里云百炼平台 → DashScope 服务 → API Key 管理

---

## 可选配置

### 4. 超时时间配置（如需要）
如果审核速度较慢，可以在云函数中增加超时时间：

**文件位置**: `cloudfunctions/createPost/index.js`  
**添加位置**: 在 `exports.main` 函数第一行添加
```javascript
// 设置超时时间为 10 秒
const timeout = 10000;
```

---

## 配置检查清单

在部署前，请确认已完成以下所有步骤：

- [ ] 已注册微信小程序并获取 AppID
- [ ] 已在 `project.config.json` 中填写 AppID
- [ ] 已开通微信云开发服务
- [ ] 已记录云环境 ID
- [ ] 已在 `app.js` 中填写云环境 ID
- [ ] 已注册阿里云账号
- [ ] 已开通 DashScope 服务
- [ ] 已创建千问 API Key
- [ ] 已在两个云函数文件中填写 API Key
- [ ] 已为云函数安装 npm 依赖
- [ ] 已上传并部署云函数
- [ ] 已创建 posts、comments、encourages 三个数据库集合
- [ ] 已设置数据库集合权限
- [ ] 已创建数据库索引
- [ ] 已在真机上测试语音功能（如需要）

---

## 快速验证配置

完成所有配置后，运行以下测试验证：

### 测试 1：编译检查
```
✓ 微信开发者工具点击"编译"无错误
✓ 控制台无红色报错信息
```

### 测试 2：云函数检查
```
✓ 右键云函数文件夹能看到"更新云端依赖"选项
✓ 云函数状态显示"已部署"
```

### 测试 3：数据库检查
```
✓ 云开发控制台能看到三个集合
✓ 集合权限设置为"自定义规则"
✓ 索引已创建完成
```

### 测试 4：功能测试
```
✓ 能正常发布帖子（文字）
✓ 帖子出现在首页
✓ 能进入帖子详情页
✓ 点击"一键鼓励"有反应
✓ 能发布评论
```

---

## 配置备份建议

建议将以下敏感信息单独保存备份：

```
config-backup.txt
------------------
AppID: wx1234567890abcdef
云环境 ID: cloud1-xxx
API Key: sk-xxxxxxxxxxxxxx
```

⚠️ **安全提醒**: 
- 不要将包含敏感信息的文件上传到公开代码仓库
- 使用 `.gitignore` 忽略配置文件
- 生产环境建议使用环境变量管理密钥

---

## 下一步

配置完成后，参考 `DEPLOYMENT.md` 文档进行完整部署。

祝你成功！💙
