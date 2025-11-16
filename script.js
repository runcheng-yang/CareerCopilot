// 数据存储
let jobData = {
    research: [],
    pending: [],
    applied: []
};

let resumeData = [];
let currentResumeId = null;

// 初始化应用
async function initApp() {
    try {
        showLoading('正在加载数据...');
        await jobDB.init();
        await loadData();
        hideLoading();
    } catch (error) {
        console.error('初始化失败:', error);
        hideLoading();
        showToast('初始化失败', error.message, 'error');
    }
}

// 从数据库加载数据
async function loadData() {
    try {
        const jobs = await jobDB.getAllJobs();
        
        // 按池子分组
        jobData = {
            research: jobs.filter(j => j.pool === 'research'),
            pending: jobs.filter(j => j.pool === 'pending'),
            applied: jobs.filter(j => j.pool === 'applied')
        };
        
        // 加载简历
        resumeData = await jobDB.getAllResumes();
        
        renderAll();
    } catch (error) {
        console.error('加载数据失败:', error);
        showToast('加载失败', '数据加载失败，请刷新页面重试', 'error');
    }
}

// 保存职位数据
async function saveJob(job) {
    try {
        await jobDB.saveJob(job);
        await loadData();
    } catch (error) {
        console.error('保存失败:', error);
        showToast('保存失败', error.message, 'error');
    }
}

// 删除职位数据
async function deleteJobFromDB(id) {
    try {
        await jobDB.deleteJob(id);
        await loadData();
    } catch (error) {
        console.error('删除失败:', error);
        showToast('删除失败', error.message, 'error');
    }
}

// 保存简历数据
async function saveResumeData(resume) {
    try {
        await jobDB.saveResume(resume);
        resumeData = await jobDB.getAllResumes();
    } catch (error) {
        console.error('保存简历失败:', error);
        showToast('保存失败', error.message, 'error');
    }
}

// 删除简历数据
async function deleteResumeFromDB(id) {
    try {
        await jobDB.deleteResume(id);
        resumeData = await jobDB.getAllResumes();
    } catch (error) {
        console.error('删除简历失败:', error);
        showToast('删除失败', error.message, 'error');
    }
}

// 更新统计数据
function updateStats() {
    document.getElementById('researchCount').textContent = jobData.research.length;
    document.getElementById('pendingCount').textContent = jobData.pending.length;
    document.getElementById('appliedCount').textContent = jobData.applied.length;
    
    // 统计面试中的数量
    const interviewCount = jobData.applied.filter(item => 
        item.status === '面试邀请' || item.status === '已面试'
    ).length;
    document.getElementById('interviewCount').textContent = interviewCount;
}

// 渲染所有池子
function renderAll() {
    renderPool('research');
    renderPool('pending');
    renderPool('applied');
    updateStats();
}

// 渲染单个池子
function renderPool(poolName) {
    const container = document.getElementById(`${poolName}Pool`);
    const items = jobData[poolName];
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-text">暂无数据，点击上方按钮添加</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => createCard(item, poolName)).join('');
}

// 创建卡片HTML
function createCard(item, poolName) {
    let infoHtml = '';
    
    if (item.position) {
        infoHtml += `<div class="card-info-item">💼 ${item.position}</div>`;
    }
    if (item.industry) {
        infoHtml += `<div class="card-info-item">🏢 ${item.industry}</div>`;
    }
    if (item.location) {
        infoHtml += `<div class="card-info-item">📍 ${item.location}</div>`;
    }
    if (item.salary) {
        infoHtml += `<div class="card-info-item">💰 ${item.salary}</div>`;
    }
    if (item.status && poolName === 'applied') {
        infoHtml += `<div class="card-info-item"><span class="status-badge status-${item.status}">${item.status}</span></div>`;
    }
    if (item.applyDate && poolName === 'applied') {
        infoHtml += `<div class="card-info-item">📅 ${item.applyDate}</div>`;
    }
    if (item.resumeUsed && poolName === 'applied') {
        const resume = resumeData.find(r => r.id === item.resumeUsed);
        if (resume) {
            infoHtml += `<div class="card-info-item">📄 ${resume.name}</div>`;
        }
    }
    
    let notesHtml = '';
    if (item.notes) {
        notesHtml = `<div class="card-notes">${item.notes}</div>`;
    }
    
    let moveButtons = '';
    if (poolName === 'research') {
        moveButtons = `<button class="card-btn" onclick="moveItem('${item.id}', 'research', 'pending')" title="移至待投递">➡️</button>`;
    } else if (poolName === 'pending') {
        moveButtons = `
            <button class="card-btn" onclick="moveItem('${item.id}', 'pending', 'research')" title="移回待研究">⬅️</button>
            <button class="card-btn" onclick="moveItem('${item.id}', 'pending', 'applied')" title="移至已投递">➡️</button>
        `;
    } else if (poolName === 'applied') {
        moveButtons = `<button class="card-btn" onclick="moveItem('${item.id}', 'applied', 'pending')" title="移回待投递">⬅️</button>`;
    }
    
    return `
        <div class="card" draggable="true" ondragstart="drag(event)" data-id="${item.id}" data-pool="${poolName}">
            <div class="card-header">
                <div class="card-title">${item.companyName}</div>
                <div class="card-actions">
                    ${moveButtons}
                    <button class="card-btn" onclick="editItem('${item.id}', '${poolName}')" title="编辑">✏️</button>
                    <button class="card-btn" onclick="deleteItem('${item.id}', '${poolName}')" title="删除">🗑️</button>
                </div>
            </div>
            <div class="card-info">
                ${infoHtml}
            </div>
            ${notesHtml}
        </div>
    `;
}

// 打开模态框
function openModal(poolName, itemId = null) {
    const modal = document.getElementById('modal');
    const form = document.getElementById('itemForm');
    const modalTitle = document.getElementById('modalTitle');
    
    // 重置表单
    form.reset();
    document.getElementById('itemId').value = itemId || '';
    document.getElementById('itemPool').value = poolName;
    
    // 更新简历选择列表
    updateResumeSelect();
    
    // 根据池子类型显示/隐藏字段
    const positionGroup = document.getElementById('positionGroup');
    const salaryGroup = document.getElementById('salaryGroup');
    const statusGroup = document.getElementById('statusGroup');
    const resumeGroup = document.getElementById('resumeGroup');
    const applyDateGroup = document.getElementById('applyDateGroup');
    
    if (poolName === 'research') {
        modalTitle.textContent = '添加待研究企业';
        positionGroup.style.display = 'none';
        salaryGroup.style.display = 'none';
        statusGroup.style.display = 'none';
        resumeGroup.style.display = 'none';
        applyDateGroup.style.display = 'none';
    } else if (poolName === 'pending') {
        modalTitle.textContent = '添加待投递岗位';
        positionGroup.style.display = 'block';
        salaryGroup.style.display = 'block';
        statusGroup.style.display = 'none';
        resumeGroup.style.display = 'none';
        applyDateGroup.style.display = 'none';
    } else {
        modalTitle.textContent = '添加已投递企业';
        positionGroup.style.display = 'block';
        salaryGroup.style.display = 'block';
        statusGroup.style.display = 'block';
        resumeGroup.style.display = 'block';
        applyDateGroup.style.display = 'block';
    }
    
    // 如果是编辑，填充数据
    if (itemId) {
        const item = jobData[poolName].find(i => i.id === itemId);
        if (item) {
            modalTitle.textContent = '编辑信息';
            document.getElementById('companyName').value = item.companyName || '';
            document.getElementById('position').value = item.position || '';
            document.getElementById('industry').value = item.industry || '';
            document.getElementById('location').value = item.location || '';
            document.getElementById('salary').value = item.salary || '';
            document.getElementById('status').value = item.status || '已投递';
            document.getElementById('resumeUsed').value = item.resumeUsed || '';
            document.getElementById('applyDate').value = item.applyDate || '';
            document.getElementById('notes').value = item.notes || '';
        }
    }
    
    modal.style.display = 'block';
}

// 关闭模态框
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// 表单提交
document.getElementById('itemForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('itemId').value;
    const poolName = document.getElementById('itemPool').value;
    
    const item = {
        id: itemId || Date.now().toString(),
        pool: poolName,
        companyName: document.getElementById('companyName').value,
        position: document.getElementById('position').value,
        industry: document.getElementById('industry').value,
        location: document.getElementById('location').value,
        salary: document.getElementById('salary').value,
        status: document.getElementById('status').value,
        resumeUsed: document.getElementById('resumeUsed').value,
        applyDate: document.getElementById('applyDate').value,
        notes: document.getElementById('notes').value,
        createdAt: itemId ? jobData[poolName].find(i => i.id === itemId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    await saveJob(item);
    closeModal();
    showToast('保存成功', '数据已保存', 'success');
});

// 删除项目
async function deleteItem(itemId, poolName) {
    if (confirm('确定要删除这个项目吗？')) {
        await deleteJobFromDB(itemId);
        showToast('删除成功', '项目已删除', 'success');
    }
}

// 编辑项目
function editItem(itemId, poolName) {
    openModal(poolName, itemId);
}

// 移动项目
async function moveItem(itemId, fromPool, toPool) {
    const item = jobData[fromPool].find(i => i.id === itemId);
    if (item) {
        // 如果移动到已投递池，设置默认状态
        if (toPool === 'applied' && !item.status) {
            item.status = '已投递';
        }
        
        item.pool = toPool;
        item.updatedAt = new Date().toISOString();
        
        await saveJob(item);
        showToast('移动成功', `已移至${toPool === 'research' ? '待研究' : toPool === 'pending' ? '待投递' : '已投递'}`, 'success');
    }
}

// 拖拽功能
function drag(event) {
    event.dataTransfer.setData('itemId', event.target.dataset.id);
    event.dataTransfer.setData('fromPool', event.target.dataset.pool);
}

// 为每个池子添加拖放事件
document.addEventListener('DOMContentLoaded', function() {
    const pools = ['researchPool', 'pendingPool', 'appliedPool'];
    const poolNames = ['research', 'pending', 'applied'];
    
    pools.forEach((poolId, index) => {
        const pool = document.getElementById(poolId);
        
        pool.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        pool.addEventListener('drop', function(e) {
            e.preventDefault();
            const itemId = e.dataTransfer.getData('itemId');
            const fromPool = e.dataTransfer.getData('fromPool');
            const toPool = poolNames[index];
            
            if (fromPool !== toPool) {
                moveItem(itemId, fromPool, toPool);
            }
        });
    });
    
    // 点击模态框外部关闭
    window.onclick = function(event) {
        const modal = document.getElementById('modal');
        if (event.target === modal) {
            closeModal();
        }
    };
    
    // 加载数据
    loadData();
});


// ========== 快速录入功能 ==========
function openQuickAdd() {
    document.getElementById('quickAddModal').style.display = 'block';
    document.getElementById('quickText').value = '';
    document.getElementById('quickPreview').classList.remove('show');
}

function closeQuickAdd() {
    document.getElementById('quickAddModal').style.display = 'none';
}

function parseQuickText() {
    const text = document.getElementById('quickText').value.trim();
    if (!text) {
        alert('请输入招聘信息');
        return;
    }
    
    const parsed = {
        companyName: '',
        position: '',
        location: '',
        salary: '',
        industry: '',
        notes: text
    };
    
    // 识别企业名称（通常在第一行或包含公司、科技等关键词）
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
        const firstLine = lines[0].trim();
        // 尝试提取企业名称（去除岗位部分）
        const companyMatch = firstLine.match(/^([^-—\s]+(?:公司|科技|集团|企业|有限|股份)?)/);
        if (companyMatch) {
            parsed.companyName = companyMatch[1];
        } else {
            parsed.companyName = firstLine.split(/[-—]/)[0].trim();
        }
        
        // 尝试提取岗位
        const positionMatch = firstLine.match(/[-—](.+)$/);
        if (positionMatch) {
            parsed.position = positionMatch[1].trim();
        }
    }
    
    // 识别地点
    const locationMatch = text.match(/(?:地点|城市|工作地点)[：:]\s*([^\n]+)/i) || 
                         text.match(/(?:北京|上海|广州|深圳|杭州|成都|武汉|西安|南京|苏州|重庆|天津|青岛|大连|厦门|长沙|郑州|济南|福州|合肥|南昌|石家庄|太原|昆明|贵阳|南宁|海口|兰州|银川|西宁|乌鲁木齐|拉萨|呼和浩特|哈尔滨|长春|沈阳)/);
    if (locationMatch) {
        parsed.location = locationMatch[1] || locationMatch[0];
    }
    
    // 识别薪资
    const salaryMatch = text.match(/(?:薪资|工资|月薪|年薪)[：:]\s*([^\n]+)/i) ||
                       text.match(/(\d+[-~]\d+[kK])/);
    if (salaryMatch) {
        parsed.salary = salaryMatch[1].trim();
    }
    
    // 识别行业
    const industryMatch = text.match(/(?:行业|领域)[：:]\s*([^\n]+)/i);
    if (industryMatch) {
        parsed.industry = industryMatch[1].trim();
    }
    
    // 显示预览
    const preview = document.getElementById('quickPreview');
    preview.innerHTML = `
        <h4>识别结果：</h4>
        <div class="quick-preview-item">
            <span class="quick-preview-label">企业名称：</span>
            <span class="quick-preview-value">${parsed.companyName || '未识别'}</span>
        </div>
        <div class="quick-preview-item">
            <span class="quick-preview-label">岗位名称：</span>
            <span class="quick-preview-value">${parsed.position || '未识别'}</span>
        </div>
        <div class="quick-preview-item">
            <span class="quick-preview-label">工作地点：</span>
            <span class="quick-preview-value">${parsed.location || '未识别'}</span>
        </div>
        <div class="quick-preview-item">
            <span class="quick-preview-label">薪资范围：</span>
            <span class="quick-preview-value">${parsed.salary || '未识别'}</span>
        </div>
        <div class="quick-preview-item">
            <span class="quick-preview-label">所属行业：</span>
            <span class="quick-preview-value">${parsed.industry || '未识别'}</span>
        </div>
    `;
    preview.classList.add('show');
    
    // 保存解析结果供提交使用
    preview.dataset.parsed = JSON.stringify(parsed);
}

document.getElementById('quickAddForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const preview = document.getElementById('quickPreview');
    const parsed = preview.dataset.parsed ? JSON.parse(preview.dataset.parsed) : null;
    
    if (!parsed || !parsed.companyName) {
        alert('请先点击"识别信息"按钮');
        return;
    }
    
    const poolName = document.getElementById('quickPool').value;
    const item = {
        id: Date.now().toString(),
        companyName: parsed.companyName,
        position: parsed.position,
        industry: parsed.industry,
        location: parsed.location,
        salary: parsed.salary,
        notes: parsed.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    jobData[poolName].push(item);
    saveData();
    renderPool(poolName);
    closeQuickAdd();
});

// ========== 简历管理功能 ==========
function openResumeManager() {
    document.getElementById('resumeModal').style.display = 'block';
    renderResumeList();
}

function closeResumeManager() {
    document.getElementById('resumeModal').style.display = 'none';
}

function renderResumeList() {
    const container = document.getElementById('resumeList');
    
    if (resumeData.length === 0) {
        container.innerHTML = '<div class="empty-state-text" style="padding: 20px; text-align: center; color: #999;">暂无简历</div>';
        return;
    }
    
    container.innerHTML = resumeData.map(resume => `
        <div class="resume-item ${currentResumeId === resume.id ? 'active' : ''}" 
             onclick="selectResume('${resume.id}')">
            <div class="resume-item-name">${resume.name}</div>
            <div class="resume-item-meta">${resume.version || ''} ${resume.target || ''}</div>
        </div>
    `).join('');
}

function selectResume(resumeId) {
    currentResumeId = resumeId;
    const resume = resumeData.find(r => r.id === resumeId);
    
    if (!resume) return;
    
    // 统计使用次数
    const usageCount = jobData.applied.filter(item => item.resumeUsed === resumeId).length;
    const usageList = jobData.applied
        .filter(item => item.resumeUsed === resumeId)
        .slice(0, 5)
        .map(item => `<div class="resume-usage-item">${item.companyName} - ${item.position || '未知岗位'}</div>`)
        .join('');
    
    const editor = document.getElementById('resumeEditor');
    editor.innerHTML = `
        <div class="resume-detail">
            <div class="resume-detail-header">
                <div>
                    <div class="resume-detail-title">${resume.name}</div>
                    <div class="resume-detail-meta">创建于 ${new Date(resume.createdAt).toLocaleDateString()}</div>
                </div>
                <div class="resume-detail-actions">
                    <button class="resume-detail-btn edit" onclick="editResume('${resume.id}')">编辑</button>
                    <button class="resume-detail-btn delete" onclick="deleteResume('${resume.id}')">删除</button>
                </div>
            </div>
            
            <div class="resume-detail-section">
                <div class="resume-detail-label">版本号</div>
                <div class="resume-detail-value">${resume.version || '未设置'}</div>
            </div>
            
            <div class="resume-detail-section">
                <div class="resume-detail-label">目标岗位</div>
                <div class="resume-detail-value">${resume.target || '未设置'}</div>
            </div>
            
            <div class="resume-detail-section">
                <div class="resume-detail-label">文件路径</div>
                <div class="resume-detail-value">${resume.file || '未设置'}</div>
            </div>
            
            <div class="resume-detail-section">
                <div class="resume-detail-label">备注</div>
                <div class="resume-detail-value">${resume.notes || '无'}</div>
            </div>
            
            <div class="resume-usage">
                <h4>📊 使用统计：已使用 ${usageCount} 次</h4>
                <div class="resume-usage-list">
                    ${usageList || '<div class="resume-usage-item">暂无使用记录</div>'}
                </div>
            </div>
        </div>
    `;
    
    renderResumeList();
}

function addResume() {
    document.getElementById('resumeEditModal').style.display = 'block';
    document.getElementById('resumeEditForm').reset();
    document.getElementById('resumeId').value = '';
    document.getElementById('resumeEditTitle').textContent = '新建简历';
}

function editResume(resumeId) {
    const resume = resumeData.find(r => r.id === resumeId);
    if (!resume) return;
    
    document.getElementById('resumeEditModal').style.display = 'block';
    document.getElementById('resumeId').value = resume.id;
    document.getElementById('resumeName').value = resume.name;
    document.getElementById('resumeVersion').value = resume.version || '';
    document.getElementById('resumeTarget').value = resume.target || '';
    document.getElementById('resumeFile').value = resume.file || '';
    document.getElementById('resumeNotes').value = resume.notes || '';
    document.getElementById('resumeEditTitle').textContent = '编辑简历';
}

function deleteResume(resumeId) {
    if (!confirm('确定要删除这份简历吗？')) return;
    
    resumeData = resumeData.filter(r => r.id !== resumeId);
    saveResumes();
    
    if (currentResumeId === resumeId) {
        currentResumeId = null;
        document.getElementById('resumeEditor').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">选择或创建一个简历</div>
            </div>
        `;
    }
    
    renderResumeList();
}

function closeResumeEdit() {
    document.getElementById('resumeEditModal').style.display = 'none';
}

document.getElementById('resumeEditForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const resumeId = document.getElementById('resumeId').value;
    const resume = {
        id: resumeId || Date.now().toString(),
        name: document.getElementById('resumeName').value,
        version: document.getElementById('resumeVersion').value,
        target: document.getElementById('resumeTarget').value,
        file: document.getElementById('resumeFile').value,
        notes: document.getElementById('resumeNotes').value,
        createdAt: resumeId ? resumeData.find(r => r.id === resumeId).createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (resumeId) {
        const index = resumeData.findIndex(r => r.id === resumeId);
        resumeData[index] = resume;
    } else {
        resumeData.push(resume);
    }
    
    saveResumes();
    closeResumeEdit();
    renderResumeList();
    
    if (currentResumeId === resume.id || !currentResumeId) {
        selectResume(resume.id);
    }
});

// ========== 投递进展功能 ==========
function openProgressView() {
    document.getElementById('progressModal').style.display = 'block';
    updateProgressStats();
    renderProgressTimeline();
}

function closeProgressView() {
    document.getElementById('progressModal').style.display = 'none';
}

function updateProgressStats() {
    const applied = jobData.applied;
    
    document.getElementById('totalApplied').textContent = applied.length;
    document.getElementById('totalViewed').textContent = applied.filter(i => i.status === '已查看').length;
    document.getElementById('totalInterview').textContent = applied.filter(i => 
        i.status === '面试邀请' || i.status === '已面试'
    ).length;
    document.getElementById('totalPassed').textContent = applied.filter(i => i.status === '已通过').length;
    document.getElementById('totalRejected').textContent = applied.filter(i => i.status === '已拒绝').length;
}

function renderProgressTimeline() {
    const container = document.getElementById('progressTimeline');
    const items = [...jobData.applied].sort((a, b) => 
        new Date(b.applyDate || b.updatedAt) - new Date(a.applyDate || a.updatedAt)
    );
    
    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state-text" style="text-align: center; padding: 40px; color: #999;">暂无投递记录</div>';
        return;
    }
    
    container.innerHTML = items.map(item => {
        const date = item.applyDate || item.updatedAt.split('T')[0];
        const resume = item.resumeUsed ? resumeData.find(r => r.id === item.resumeUsed) : null;
        
        return `
            <div class="timeline-item">
                <div class="timeline-date">${date}</div>
                <div class="timeline-content">
                    <div class="timeline-company">${item.companyName}</div>
                    <div class="timeline-position">${item.position || '未知岗位'} ${item.location ? '· ' + item.location : ''}</div>
                    <div class="timeline-status">
                        <span class="status-badge status-${item.status}">${item.status || '已投递'}</span>
                        ${resume ? `<span style="color: #666;">· 使用简历：${resume.name}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 更新简历选择下拉框
function updateResumeSelect() {
    const select = document.getElementById('resumeUsed');
    select.innerHTML = '<option value="">未选择</option>' + 
        resumeData.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
}


// ========== AI 解析功能 ==========
async function parseWithAI() {
    const text = document.getElementById('quickText').value.trim();
    if (!text) {
        showToast('提示', '请输入招聘信息', 'info');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '🤖 解析中...';

    try {
        showLoading('AI 正在解析中...');
        const parsed = await aiParser.parse(text);
        hideLoading();

        // 显示预览
        const preview = document.getElementById('quickPreview');
        preview.innerHTML = `
            <h4>AI 识别结果：</h4>
            <div class="quick-preview-item">
                <span class="quick-preview-label">企业名称：</span>
                <span class="quick-preview-value">${parsed.companyName || '未识别'}</span>
            </div>
            <div class="quick-preview-item">
                <span class="quick-preview-label">岗位名称：</span>
                <span class="quick-preview-value">${parsed.position || '未识别'}</span>
            </div>
            <div class="quick-preview-item">
                <span class="quick-preview-label">工作地点：</span>
                <span class="quick-preview-value">${parsed.location || '未识别'}</span>
            </div>
            <div class="quick-preview-item">
                <span class="quick-preview-label">薪资范围：</span>
                <span class="quick-preview-value">${parsed.salary || '未识别'}</span>
            </div>
            <div class="quick-preview-item">
                <span class="quick-preview-label">所属行业：</span>
                <span class="quick-preview-value">${parsed.industry || '未识别'}</span>
            </div>
        `;
        preview.classList.add('show');
        preview.dataset.parsed = JSON.stringify(parsed);

        showToast('解析成功', 'AI 已完成信息识别', 'success');
    } catch (error) {
        hideLoading();
        console.error('AI 解析失败:', error);
        showToast('解析失败', error.message || 'AI 解析失败，请检查配置或使用本地识别', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '🤖 AI 识别';
    }
}

// ========== 设置功能 ==========
function openSettings() {
    document.getElementById('settingsModal').style.display = 'block';
    loadAISettingsUI();
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function switchSettingsTab(tab) {
    // 切换标签
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    // 切换面板
    document.getElementById('aiSettings').style.display = tab === 'ai' ? 'block' : 'none';
    document.getElementById('dataSettings').style.display = tab === 'data' ? 'block' : 'none';
}

function loadAISettingsUI() {
    document.getElementById('aiProvider').value = AI_CONFIG.provider;
    updateAIProviderFields();
}

function updateAIProviderFields() {
    const provider = document.getElementById('aiProvider').value;
    const config = AI_CONFIG[provider];

    document.getElementById('aiApiKey').value = config.apiKey || '';
    document.getElementById('aiModel').value = config.model || '';
    document.getElementById('aiBaseURL').value = config.baseURL || '';

    // 本地模型不需要 API Key
    const apiKeyGroup = document.getElementById('apiKeyGroup');
    apiKeyGroup.style.display = provider === 'local' ? 'none' : 'block';
}

function saveAISettings() {
    const provider = document.getElementById('aiProvider').value;
    
    AI_CONFIG.provider = provider;
    AI_CONFIG[provider].apiKey = document.getElementById('aiApiKey').value;
    AI_CONFIG[provider].model = document.getElementById('aiModel').value;
    AI_CONFIG[provider].baseURL = document.getElementById('aiBaseURL').value;

    saveAIConfig();
    showToast('保存成功', 'AI 配置已保存', 'success');
}

async function testAIConnection() {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '测试中...';

    try {
        showLoading('正在测试 AI 连接...');
        const testText = '阿里巴巴 - 前端工程师\n地点：杭州\n薪资：20-35K';
        await aiParser.parse(testText);
        hideLoading();
        showToast('测试成功', 'AI 连接正常', 'success');
    } catch (error) {
        hideLoading();
        showToast('测试失败', error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '测试连接';
    }
}

// ========== 数据管理功能 ==========
async function exportAllData() {
    try {
        showLoading('正在导出数据...');
        const data = await jobDB.exportData();
        
        // 创建下载链接
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `求职看板数据_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        hideLoading();
        showToast('导出成功', '数据已导出到文件', 'success');
    } catch (error) {
        hideLoading();
        console.error('导出失败:', error);
        showToast('导出失败', error.message, 'error');
    }
}

async function importDataFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('导入数据会覆盖现有数据，是否继续？\n建议先导出备份！')) {
        event.target.value = '';
        return;
    }

    try {
        showLoading('正在导入数据...');
        const text = await file.text();
        const data = JSON.parse(text);
        
        await jobDB.importData(data);
        await loadData();
        
        hideLoading();
        showToast('导入成功', '数据已导入', 'success');
        event.target.value = '';
    } catch (error) {
        hideLoading();
        console.error('导入失败:', error);
        showToast('导入失败', '文件格式错误或数据损坏', 'error');
        event.target.value = '';
    }
}

async function migrateOldData() {
    if (!confirm('确定要从旧版本迁移数据吗？')) return;

    try {
        showLoading('正在迁移数据...');
        const success = await jobDB.migrateFromLocalStorage();
        
        if (success) {
            await loadData();
            hideLoading();
            showToast('迁移成功', '数据已从旧版本迁移', 'success');
        } else {
            hideLoading();
            showToast('迁移失败', '未找到旧版本数据', 'info');
        }
    } catch (error) {
        hideLoading();
        console.error('迁移失败:', error);
        showToast('迁移失败', error.message, 'error');
    }
}

async function clearAllData() {
    if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) return;
    if (!confirm('再次确认：真的要删除所有数据吗？')) return;

    try {
        showLoading('正在清空数据...');
        await jobDB.clearAll();
        await loadData();
        hideLoading();
        showToast('清空成功', '所有数据已清空', 'success');
    } catch (error) {
        hideLoading();
        console.error('清空失败:', error);
        showToast('清空失败', error.message, 'error');
    }
}

// ========== UI 辅助函数 ==========
function showLoading(text = '加载中...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <div class="loading-text">${text}</div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== 更新简历相关函数 ==========
document.getElementById('resumeEditForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const resumeId = document.getElementById('resumeId').value;
    const resume = {
        id: resumeId || Date.now().toString(),
        name: document.getElementById('resumeName').value,
        version: document.getElementById('resumeVersion').value,
        target: document.getElementById('resumeTarget').value,
        file: document.getElementById('resumeFile').value,
        notes: document.getElementById('resumeNotes').value,
        createdAt: resumeId ? resumeData.find(r => r.id === resumeId)?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    await saveResumeData(resume);
    closeResumeEdit();
    renderResumeList();
    
    if (currentResumeId === resume.id || !currentResumeId) {
        selectResume(resume.id);
    }
    
    showToast('保存成功', '简历已保存', 'success');
});

async function deleteResume(resumeId) {
    if (!confirm('确定要删除这份简历吗？')) return;
    
    await deleteResumeFromDB(resumeId);
    
    if (currentResumeId === resumeId) {
        currentResumeId = null;
        document.getElementById('resumeEditor').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">选择或创建一个简历</div>
            </div>
        `;
    }
    
    renderResumeList();
    showToast('删除成功', '简历已删除', 'success');
}

document.getElementById('quickAddForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const preview = document.getElementById('quickPreview');
    const parsed = preview.dataset.parsed ? JSON.parse(preview.dataset.parsed) : null;
    
    if (!parsed || !parsed.companyName) {
        showToast('提示', '请先点击识别按钮', 'info');
        return;
    }
    
    const poolName = document.getElementById('quickPool').value;
    const item = {
        id: Date.now().toString(),
        pool: poolName,
        companyName: parsed.companyName,
        position: parsed.position,
        industry: parsed.industry,
        location: parsed.location,
        salary: parsed.salary,
        notes: parsed.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    await saveJob(item);
    closeQuickAdd();
    showToast('添加成功', '已添加到' + (poolName === 'research' ? '待研究' : '待投递'), 'success');
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    
    const pools = ['researchPool', 'pendingPool', 'appliedPool'];
    const poolNames = ['research', 'pending', 'applied'];
    
    pools.forEach((poolId, index) => {
        const pool = document.getElementById(poolId);
        
        pool.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
        
        pool.addEventListener('drop', function(e) {
            e.preventDefault();
            const itemId = e.dataTransfer.getData('itemId');
            const fromPool = e.dataTransfer.getData('fromPool');
            const toPool = poolNames[index];
            
            if (fromPool !== toPool) {
                moveItem(itemId, fromPool, toPool);
            }
        });
    });
    
    window.onclick = function(event) {
        const modal = document.getElementById('modal');
        const quickModal = document.getElementById('quickAddModal');
        const resumeModal = document.getElementById('resumeModal');
        const progressModal = document.getElementById('progressModal');
        const settingsModal = document.getElementById('settingsModal');
        
        if (event.target === modal) closeModal();
        if (event.target === quickModal) closeQuickAdd();
        if (event.target === resumeModal) closeResumeManager();
        if (event.target === progressModal) closeProgressView();
        if (event.target === settingsModal) closeSettings();
    };
});
