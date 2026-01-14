/**
 * 本地命盘存储工具模块
 * 
 * 管理未登录用户的本地命盘数据存储
 * 从 BaziInputPage.jsx 中抽离，避免循环依赖
 */

const LOCAL_SUBJECTS_KEY = 'bazi_local_subjects';

/**
 * 生成本地 ID
 * @returns {string} 格式: local_{timestamp}_{random}
 */
export const generateLocalId = () =>
    `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * 获取本地保存的所有命盘
 * @returns {Array} 本地命盘列表
 */
export const getLocalSubjects = () => {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_SUBJECTS_KEY) || '[]');
    } catch {
        return [];
    }
};

/**
 * 保存命盘到本地存储
 * 如果存在同名命盘则更新，否则新增
 * @param {Object} subject - 命盘对象
 * @returns {Object} 保存后的命盘对象
 */
export const saveLocalSubject = (subject) => {
    const subjects = getLocalSubjects();
    const existingIndex = subjects.findIndex(s => s.name === subject.name);

    if (existingIndex >= 0) {
        subjects[existingIndex] = subject; // 更新
    } else {
        subjects.push(subject); // 新增
    }

    localStorage.setItem(LOCAL_SUBJECTS_KEY, JSON.stringify(subjects));
    return subject;
};

/**
 * 删除本地命盘
 * @param {string} id - 命盘 ID
 */
export const deleteLocalSubject = (id) => {
    const subjects = getLocalSubjects().filter(s => s.id !== id);
    localStorage.setItem(LOCAL_SUBJECTS_KEY, JSON.stringify(subjects));
};

/**
 * 根据 ID 获取单个本地命盘
 * @param {string} id - 命盘 ID
 * @returns {Object|undefined} 命盘对象或 undefined
 */
export const getLocalSubjectById = (id) => {
    return getLocalSubjects().find(s => s.id === id);
};
