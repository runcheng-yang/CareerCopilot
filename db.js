// IndexedDB 数据库管理
class JobBoardDB {
    constructor() {
        this.dbName = 'JobBoardDB';
        this.version = 1;
        this.db = null;
    }

    // 初始化数据库
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建职位表
                if (!db.objectStoreNames.contains('jobs')) {
                    const jobStore = db.createObjectStore('jobs', { keyPath: 'id' });
                    jobStore.createIndex('pool', 'pool', { unique: false });
                    jobStore.createIndex('status', 'status', { unique: false });
                    jobStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // 创建简历表
                if (!db.objectStoreNames.contains('resumes')) {
                    const resumeStore = db.createObjectStore('resumes', { keyPath: 'id' });
                    resumeStore.createIndex('name', 'name', { unique: false });
                }
            };
        });
    }

    // 添加或更新职位
    async saveJob(job) {
        const tx = this.db.transaction(['jobs'], 'readwrite');
        const store = tx.objectStore('jobs');
        return store.put(job);
    }

    // 获取所有职位
    async getAllJobs() {
        const tx = this.db.transaction(['jobs'], 'readonly');
        const store = tx.objectStore('jobs');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 按池子获取职位
    async getJobsByPool(pool) {
        const tx = this.db.transaction(['jobs'], 'readonly');
        const store = tx.objectStore('jobs');
        const index = store.index('pool');
        return new Promise((resolve, reject) => {
            const request = index.getAll(pool);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 删除职位
    async deleteJob(id) {
        const tx = this.db.transaction(['jobs'], 'readwrite');
        const store = tx.objectStore('jobs');
        return store.delete(id);
    }

    // 添加或更新简历
    async saveResume(resume) {
        const tx = this.db.transaction(['resumes'], 'readwrite');
        const store = tx.objectStore('resumes');
        return store.put(resume);
    }

    // 获取所有简历
    async getAllResumes() {
        const tx = this.db.transaction(['resumes'], 'readonly');
        const store = tx.objectStore('resumes');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 删除简历
    async deleteResume(id) {
        const tx = this.db.transaction(['resumes'], 'readwrite');
        const store = tx.objectStore('resumes');
        return store.delete(id);
    }

    // 导出所有数据为 JSON
    async exportData() {
        const jobs = await this.getAllJobs();
        const resumes = await this.getAllResumes();
        return {
            version: this.version,
            exportDate: new Date().toISOString(),
            jobs,
            resumes
        };
    }

    // 从 JSON 导入数据
    async importData(data) {
        // 清空现有数据
        await this.clearAll();

        // 导入职位
        const jobTx = this.db.transaction(['jobs'], 'readwrite');
        const jobStore = jobTx.objectStore('jobs');
        for (const job of data.jobs || []) {
            await jobStore.put(job);
        }

        // 导入简历
        const resumeTx = this.db.transaction(['resumes'], 'readwrite');
        const resumeStore = resumeTx.objectStore('resumes');
        for (const resume of data.resumes || []) {
            await resumeStore.put(resume);
        }

        return true;
    }

    // 清空所有数据
    async clearAll() {
        const tx = this.db.transaction(['jobs', 'resumes'], 'readwrite');
        await tx.objectStore('jobs').clear();
        await tx.objectStore('resumes').clear();
    }

    // 从旧的 localStorage 迁移数据
    async migrateFromLocalStorage() {
        try {
            // 迁移职位数据
            const oldJobData = localStorage.getItem('jobBoardData');
            if (oldJobData) {
                const jobData = JSON.parse(oldJobData);
                const allJobs = [
                    ...jobData.research.map(j => ({ ...j, pool: 'research' })),
                    ...jobData.pending.map(j => ({ ...j, pool: 'pending' })),
                    ...jobData.applied.map(j => ({ ...j, pool: 'applied' }))
                ];

                for (const job of allJobs) {
                    await this.saveJob(job);
                }
                console.log('职位数据迁移完成');
            }

            // 迁移简历数据
            const oldResumeData = localStorage.getItem('resumeData');
            if (oldResumeData) {
                const resumes = JSON.parse(oldResumeData);
                for (const resume of resumes) {
                    await this.saveResume(resume);
                }
                console.log('简历数据迁移完成');
            }

            return true;
        } catch (error) {
            console.error('数据迁移失败:', error);
            return false;
        }
    }
}

// 创建全局数据库实例
const jobDB = new JobBoardDB();
