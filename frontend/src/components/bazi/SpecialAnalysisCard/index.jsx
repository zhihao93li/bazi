import { useState, useEffect, useMemo } from 'react';
import { Lock, Sparkle, Coins, Spinner } from '@phosphor-icons/react';
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
 * 
 * 支持并行解锁：每个主题独立显示自己的 loading 状态
 */
export default function SpecialAnalysisCard({
  themesData = {},
  onUnlock,
  className = '',
}) {
  const [activeTab, setActiveTab] = useState(SPECIAL_THEMES[0].id);
  const [displayContent, setDisplayContent] = useState('');

  // 当 themesData 变化时更新显示内容
  useEffect(() => {
    const data = themesData[activeTab];
    if (data?.content) {
      setDisplayContent(data.content);
    } else {
      setDisplayContent('');
    }
  }, [activeTab, themesData]);

  // 计算当前 tab 的状态
  const activeData = themesData[activeTab] || {};
  const isCurrentTabLoading = activeData.isLoading || false;
  const isUnlocked = activeData.isUnlocked || false;
  const price = activeData.price || 0;
  const activeTheme = SPECIAL_THEMES.find(t => t.id === activeTab);

  // 计算正在加载的主题列表（用于显示提示）
  const loadingThemes = useMemo(() => {
    return SPECIAL_THEMES.filter(t => {
      const data = themesData[t.id];
      return data?.isLoading && t.id !== activeTab;
    });
  }, [themesData, activeTab]);

  // 处理解锁点击
  const handleUnlockClick = () => {
    // 只检查当前主题是否在加载，允许并行解锁其他主题
    if (isCurrentTabLoading) return;
    onUnlock?.(activeTab);
  };

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
          const isThemeLoading = data.isLoading || false;
          
          return (
            <div
              key={theme.id}
              className={`${styles.tab} ${isActive ? styles.active : ''} ${!themeUnlocked ? styles.locked : ''}`}
              onClick={() => setActiveTab(theme.id)}
            >
              <span>{theme.name}</span>
              {isThemeLoading ? (
                <Spinner className={styles.tabSpinner} size={12} />
              ) : !themeUnlocked ? (
                <Lock className={styles.tabLockIcon} weight="fill" size={12} />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* 内容区域 */}
      {isCurrentTabLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>AI 正在解读「{activeTheme?.name}」...</span>
          <span className={styles.loadingHint}>通常需要 10-30 秒</span>
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
            disabled={isCurrentTabLoading}
          >
            <Sparkle weight="fill" size={16} />
            <span>解锁「{activeTheme?.name}」</span>
            <span className={styles.unlockPrice}>
              <Coins weight="fill" size={14} />
              {price}
            </span>
          </button>
          {/* 显示其他主题正在加载的提示 */}
          {loadingThemes.length > 0 && (
            <div className={styles.otherLoadingHint}>
              <Spinner size={14} />
              <span>
                {loadingThemes.length === 1 
                  ? `正在解锁「${loadingThemes[0].name}」...`
                  : `正在解锁 ${loadingThemes.length} 个主题...`
                }
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
