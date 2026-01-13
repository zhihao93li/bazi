import { useState, useEffect, useRef, useCallback } from 'react';
import { Lock, Sparkle, Coins } from '@phosphor-icons/react';
import Card from '../../common/Card';
import styles from './SpecialAnalysisCard.module.css';

/**
 * 专项分析的子主题配置
 */
const SPECIAL_THEMES = [
  { id: 'relationship', name: '亲密关系' },
  { id: 'career_wealth', name: '事业财富' },
  { id: 'health', name: '身心健康' },
  { id: 'life_lesson', name: '人生课题' },
];

/**
 * 简单的 Markdown 解析
 */
function parseSimpleMarkdown(text) {
  if (!text) return '';
  
  return text
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>')
    .replace(/^\d\. (.*$)/gm, '<ul><li>$1</li></ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\n\n/g, '<br/><br/>');
}

/**
 * 专项分析卡片组件
 */
export default function SpecialAnalysisCard({
  themesData = {},
  loadingTheme,
  onUnlock,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState(SPECIAL_THEMES[0].id);
  const [displayContent, setDisplayContent] = useState('');
  const [isClicking, setIsClicking] = useState(false);
  const clickTimeoutRef = useRef(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // 带防抖的点击处理
  const handleUnlockClick = useCallback(() => {
    if (isClicking || loadingTheme) return;
    
    setIsClicking(true);
    onUnlock?.(activeTab);
    
    clickTimeoutRef.current = setTimeout(() => {
      setIsClicking(false);
    }, 3000);
  }, [isClicking, loadingTheme, onUnlock, activeTab]);

  useEffect(() => {
    const data = themesData[activeTab];
    if (data?.content) {
      setDisplayContent(data.content);
    } else {
      setDisplayContent('');
    }
  }, [activeTab, themesData]);

  const activeData = themesData[activeTab] || {};
  const isLoading = loadingTheme === activeTab;
  const isUnlocked = activeData.isUnlocked || false;
  const price = activeData.price || 0;
  const activeTheme = SPECIAL_THEMES.find(t => t.id === activeTab);

  return (
    <Card className={`${styles.container} ${className}`}>
      {/* 标题 */}
      <h3 className={styles.title}>专项分析</h3>

      {/* Tab 导航 */}
      <div className={styles.tabs}>
        {SPECIAL_THEMES.map((theme) => {
          const data = themesData[theme.id] || {};
          const isActive = activeTab === theme.id;
          const themeUnlocked = data.isUnlocked || false;
          
          return (
            <div
              key={theme.id}
              className={`${styles.tab} ${isActive ? styles.active : ''} ${!themeUnlocked ? styles.locked : ''}`}
              onClick={() => setActiveTab(theme.id)}
            >
              <span>{theme.name}</span>
              {!themeUnlocked && (
                <Lock className={styles.tabLockIcon} weight="fill" size={12} />
              )}
            </div>
          );
        })}
      </div>

      {/* 内容区域 */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>AI 正在解读「{activeTheme?.name}」...</span>
        </div>
      ) : isUnlocked && displayContent ? (
        <div className={styles.content}>
          <div dangerouslySetInnerHTML={{ 
            __html: parseSimpleMarkdown(displayContent) 
          }} />
        </div>
      ) : (
        <div className={styles.lockedContainer}>
          <div className={styles.lockedIcon}>
            <Lock weight="fill" />
          </div>
          <button 
            className={styles.unlockButton}
            onClick={handleUnlockClick}
            disabled={isClicking || !!loadingTheme}
          >
            <Sparkle weight="fill" size={16} />
            <span>{isClicking ? '请求中...' : `解锁「${activeTheme?.name}」`}</span>
            <span className={styles.unlockPrice}>
              <Coins weight="fill" size={14} />
              {price}
            </span>
          </button>
        </div>
      )}
    </Card>
  );
}
