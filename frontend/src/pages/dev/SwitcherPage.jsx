import { useState, useEffect } from 'react';
import SubjectSwitcher from '../../components/bazi/SubjectSwitcher';
import styles from './SwitcherPage.module.css';

// Local Mock Data
const MOCK_SUBJECTS = [
  { id: '1', name: '张三', relationship: 'self' },
  { id: '2', name: '李四', relationship: 'friend' },
  { id: '3', name: '王五', relationship: 'other' },
];

export default function SwitcherPage() {
  const [current, setCurrent] = useState(MOCK_SUBJECTS[0]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>人物切换器组件</h1>
      
      <div className={styles.demoArea}>
        <div className={styles.label}>当前选择: {current?.name}</div>
        
        <SubjectSwitcher 
          currentSubject={current}
          subjects={MOCK_SUBJECTS}
          onSelect={setCurrent}
        />
      </div>

      <div className={styles.note}>
        提示：点击 "添加新对象" 会跳转到 /subjects 页面
      </div>
    </div>
  );
}
