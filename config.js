// AI API 配置
const AI_CONFIG = {
    // 当前使用的 AI 服务提供商
    provider: 'openai', // 可选: 'openai', 'deepseek', 'zhipu', 'local'
    
    // OpenAI 配置
    openai: {
        apiKey: '', // 在设置中填写
        model: 'gpt-3.5-turbo',
        baseURL: 'https://api.openai.com/v1'
    },
    
    // DeepSeek 配置
    deepseek: {
        apiKey: '', // 在设置中填写
        model: 'deepseek-chat',
        baseURL: 'https://api.deepseek.com/v1'
    },
    
    // 智谱 AI 配置
    zhipu: {
        apiKey: '', // 在设置中填写
        model: 'glm-4',
        baseURL: 'https://open.bigmodel.cn/api/paas/v4'
    },
    
    // 本地模型配置（如 Ollama）
    local: {
        model: 'llama2',
        baseURL: 'http://localhost:11434/api'
    }
};

// 从本地存储加载配置
function loadAIConfig() {
    const saved = localStorage.getItem('aiConfig');
    if (saved) {
        const config = JSON.parse(saved);
        Object.assign(AI_CONFIG, config);
    }
}

// 保存配置到本地存储
function saveAIConfig() {
    localStorage.setItem('aiConfig', JSON.stringify(AI_CONFIG));
}

// 初始化时加载配置
loadAIConfig();
