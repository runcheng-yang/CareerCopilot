# AI 配置指南

## 支持的 AI 服务

### 1. OpenAI (推荐)

**优点：**
- 识别准确度最高
- 响应速度快
- 支持多种模型

**配置步骤：**
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册账号并创建 API Key
3. 在设置中选择 "OpenAI"
4. 填入 API Key
5. 模型选择：`gpt-3.5-turbo`（推荐）或 `gpt-4`
6. API 地址：`https://api.openai.com/v1`

**费用：**
- GPT-3.5-Turbo: $0.0015/1K tokens（约 0.01 元/次）
- GPT-4: $0.03/1K tokens（约 0.2 元/次）

---

### 2. DeepSeek (国内推荐)

**优点：**
- 国内可直接访问
- 性价比极高
- 中文理解能力强

**配置步骤：**
1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册账号并创建 API Key
3. 在设置中选择 "DeepSeek"
4. 填入 API Key
5. 模型：`deepseek-chat`
6. API 地址：`https://api.deepseek.com/v1`

**费用：**
- DeepSeek-Chat: ¥0.001/1K tokens（约 0.002 元/次）
- 新用户赠送 500 万 tokens

---

### 3. 智谱 AI (国内备选)

**优点：**
- 国内服务，稳定可靠
- 中文优化
- 有免费额度

**配置步骤：**
1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册账号并创建 API Key
3. 在设置中选择 "智谱 AI"
4. 填入 API Key
5. 模型：`glm-4` 或 `glm-3-turbo`
6. API 地址：`https://open.bigmodel.cn/api/paas/v4`

**费用：**
- GLM-3-Turbo: ¥0.005/1K tokens
- GLM-4: ¥0.1/1K tokens
- 新用户赠送 1000 万 tokens

---

### 4. 本地模型 (隐私优先)

**优点：**
- 完全免费
- 数据不出本地
- 无需网络

**配置步骤：**

#### 使用 Ollama（推荐）

1. **安装 Ollama**
   - Windows: 下载 [Ollama for Windows](https://ollama.ai/download)
   - Mac: `brew install ollama`
   - Linux: `curl -fsSL https://ollama.ai/install.sh | sh`

2. **下载模型**
   ```bash
   ollama pull llama2
   # 或者使用中文优化模型
   ollama pull qwen
   ```

3. **启动服务**
   ```bash
   ollama serve
   ```

4. **配置应用**
   - 在设置中选择 "本地模型"
   - 模型：`llama2` 或 `qwen`
   - API 地址：`http://localhost:11434/api`

**注意：**
- 本地模型需要较好的硬件配置（建议 16GB+ 内存）
- 识别准确度可能不如云端模型
- 首次运行需要下载模型（2-7GB）

---

## 快速开始

### 最简单的方案：DeepSeek

1. 访问 https://platform.deepseek.com/
2. 注册账号（支持手机号）
3. 进入"API Keys"页面
4. 点击"创建新的 API Key"
5. 复制 API Key
6. 在应用中打开"设置" → "AI 配置"
7. 选择 "DeepSeek"
8. 粘贴 API Key
9. 点击"保存配置"
10. 点击"测试连接"验证

---

## 使用建议

### 选择建议

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 国内用户 | DeepSeek | 速度快、便宜、中文好 |
| 追求准确度 | OpenAI GPT-4 | 识别最准确 |
| 预算有限 | DeepSeek / 智谱 AI | 性价比高，有免费额度 |
| 注重隐私 | 本地模型 | 数据不出本地 |
| 偶尔使用 | OpenAI GPT-3.5 | 按量付费，无需订阅 |

### 成本估算

假设每天识别 20 个招聘信息：

| 服务 | 月成本 | 年成本 |
|------|--------|--------|
| DeepSeek | ¥1.2 | ¥14.4 |
| 智谱 GLM-3 | ¥3 | ¥36 |
| OpenAI GPT-3.5 | ¥6 | ¥72 |
| OpenAI GPT-4 | ¥120 | ¥1440 |
| 本地模型 | ¥0 | ¥0 |

---

## 常见问题

### Q: API Key 安全吗？

A: API Key 仅保存在你的浏览器本地存储中，不会上传到任何服务器。但建议：
- 定期更换 API Key
- 不要在公共电脑上使用
- 设置 API Key 的使用限额

### Q: 为什么识别失败？

可能原因：
1. API Key 未配置或错误
2. 网络连接问题
3. API 额度用完
4. 输入文本格式不规范

解决方法：
- 点击"测试连接"检查配置
- 检查网络连接
- 查看 API 平台的使用情况
- 使用"本地识别"作为备用

### Q: 本地识别和 AI 识别有什么区别？

| 特性 | 本地识别 | AI 识别 |
|------|---------|---------|
| 准确度 | 中等 | 高 |
| 速度 | 快 | 较快 |
| 成本 | 免费 | 付费 |
| 网络 | 不需要 | 需要 |
| 复杂文本 | 较差 | 优秀 |

建议：
- 格式规范的信息用本地识别
- 复杂或非标准格式用 AI 识别

### Q: 如何节省 API 费用？

1. 优先使用本地识别
2. 只在复杂情况下使用 AI
3. 选择性价比高的服务（DeepSeek）
4. 批量整理后一次性识别
5. 设置 API 使用限额

---

## 隐私说明

### 数据流向

1. **本地识别**：数据不离开你的电脑
2. **AI 识别**：招聘信息文本会发送到 AI 服务商
3. **数据存储**：所有数据存储在浏览器本地数据库

### 隐私建议

- 如果招聘信息包含敏感内容，使用本地识别
- 定期导出数据备份
- 不要在公共电脑上使用
- 使用完毕后可清空浏览器数据

---

## 技术支持

### OpenAI
- 文档：https://platform.openai.com/docs
- 社区：https://community.openai.com/

### DeepSeek
- 文档：https://platform.deepseek.com/docs
- 客服：support@deepseek.com

### 智谱 AI
- 文档：https://open.bigmodel.cn/dev/api
- 客服：在线客服

### Ollama
- 文档：https://ollama.ai/docs
- GitHub：https://github.com/ollama/ollama
