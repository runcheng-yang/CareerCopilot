// AI 智能解析模块
class AIParser {
    constructor() {
        this.systemPrompt = `你是一个招聘信息解析助手。用户会提供招聘信息文本，你需要从中提取关键信息。

请以 JSON 格式返回，包含以下字段：
- companyName: 企业名称（必填）
- position: 岗位名称
- location: 工作地点（城市）
- salary: 薪资范围
- industry: 所属行业
- requirements: 岗位要求（简短总结）
- description: 岗位描述（简短总结）

注意：
1. 如果某个字段无法识别，返回空字符串
2. 薪资格式统一为：XX-XXK 或 XX-XXK·X薪
3. 只返回 JSON，不要其他说明文字
4. 企业名称必须准确提取`;
    }

    // 调用 AI API 解析
    async parse(text) {
        const provider = AI_CONFIG.provider;
        const config = AI_CONFIG[provider];

        if (!config.apiKey && provider !== 'local') {
            throw new Error('请先在设置中配置 AI API Key');
        }

        try {
            let result;
            
            if (provider === 'zhipu') {
                result = await this.callZhipuAPI(text, config);
            } else if (provider === 'local') {
                result = await this.callLocalAPI(text, config);
            } else {
                // OpenAI 兼容接口（OpenAI、DeepSeek 等）
                result = await this.callOpenAICompatibleAPI(text, config);
            }

            return this.parseResult(result);
        } catch (error) {
            console.error('AI 解析失败:', error);
            throw error;
        }
    }

    // 调用 OpenAI 兼容的 API
    async callOpenAICompatibleAPI(text, config) {
        const response = await fetch(`${config.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: text }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API 调用失败: ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // 调用智谱 AI API
    async callZhipuAPI(text, config) {
        const response = await fetch(`${config.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: text }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API 调用失败: ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // 调用本地 API（如 Ollama）
    async callLocalAPI(text, config) {
        const response = await fetch(`${config.baseURL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: config.model,
                prompt: `${this.systemPrompt}\n\n用户输入：\n${text}`,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error('本地 API 调用失败');
        }

        const data = await response.json();
        return data.response;
    }

    // 解析 AI 返回结果
    parseResult(content) {
        try {
            // 尝试提取 JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    companyName: parsed.companyName || '',
                    position: parsed.position || '',
                    location: parsed.location || '',
                    salary: parsed.salary || '',
                    industry: parsed.industry || '',
                    notes: this.buildNotes(parsed)
                };
            }
            throw new Error('无法解析 AI 返回结果');
        } catch (error) {
            console.error('解析结果失败:', error);
            throw new Error('AI 返回格式错误，请重试');
        }
    }

    // 构建备注信息
    buildNotes(parsed) {
        let notes = [];
        if (parsed.requirements) {
            notes.push(`要求：${parsed.requirements}`);
        }
        if (parsed.description) {
            notes.push(`描述：${parsed.description}`);
        }
        return notes.join('\n');
    }

    // 本地正则解析（作为备用方案）
    localParse(text) {
        const parsed = {
            companyName: '',
            position: '',
            location: '',
            salary: '',
            industry: '',
            notes: text
        };

        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            const companyMatch = firstLine.match(/^([^-—\s]+(?:公司|科技|集团|企业|有限|股份)?)/);
            if (companyMatch) {
                parsed.companyName = companyMatch[1];
            } else {
                parsed.companyName = firstLine.split(/[-—]/)[0].trim();
            }

            const positionMatch = firstLine.match(/[-—](.+)$/);
            if (positionMatch) {
                parsed.position = positionMatch[1].trim();
            }
        }

        const locationMatch = text.match(/(?:地点|城市|工作地点)[：:]\s*([^\n]+)/i) ||
            text.match(/(?:北京|上海|广州|深圳|杭州|成都|武汉|西安|南京|苏州|重庆|天津|青岛|大连|厦门|长沙|郑州|济南|福州|合肥|南昌|石家庄|太原|昆明|贵阳|南宁|海口|兰州|银川|西宁|乌鲁木齐|拉萨|呼和浩特|哈尔滨|长春|沈阳)/);
        if (locationMatch) {
            parsed.location = locationMatch[1] || locationMatch[0];
        }

        const salaryMatch = text.match(/(?:薪资|工资|月薪|年薪)[：:]\s*([^\n]+)/i) ||
            text.match(/(\d+[-~]\d+[kK])/);
        if (salaryMatch) {
            parsed.salary = salaryMatch[1].trim();
        }

        const industryMatch = text.match(/(?:行业|领域)[：:]\s*([^\n]+)/i);
        if (industryMatch) {
            parsed.industry = industryMatch[1].trim();
        }

        return parsed;
    }
}

// 创建全局解析器实例
const aiParser = new AIParser();
