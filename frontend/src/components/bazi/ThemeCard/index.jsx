import { useState, useEffect } from 'react';
import { Lock, Sparkle, Coins } from '@phosphor-icons/react';
import Card from '../../common/Card';
import styles from './ThemeCard.module.css';

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
 * 通用主题卡片组件
 * 
 * 支持并行解锁：每个主题独立显示自己的 loading 状态
 */
export default function ThemeCard({
  theme,
  title,
  price = 0,
  isUnlocked = false,
  content,
  isLoading = false,
  onUnlock,
  className = '',
}) {
  const [displayContent, setDisplayContent] = useState('');

  // 当 content 变化时更新显示内容
  useEffect(() => {
    if (content) {
      setDisplayContent(content);
    }
  }, [content]);

  // 处理解锁点击
  const handleUnlockClick = () => {
    if (isLoading) return;
    onUnlock?.(theme);
  };

  // 渲染加载状态
  if (isLoading) {
    return (
      <Card className={`${styles.container} ${className}`}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>AI 正在解读中，请稍候...</span>
          <span className={styles.loadingHint}>通常需要 10-30 秒</span>
        </div>
      </Card>
    );
  }

  // 渲染锁定状态
  if (!isUnlocked) {
    return (
      <Card className={`${styles.container} ${className}`}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.lockedContainer}>
          <div className={styles.lockedIcon}>
            <Lock weight="fill" />
          </div>
          <button 
            className={styles.unlockButton}
            onClick={handleUnlockClick}
            disabled={isLoading}
          >
            <Sparkle weight="fill" size={16} />
            <span>解锁解读</span>
            <span className={styles.unlockPrice}>
              <Coins weight="fill" size={14} />
              {price}
            </span>
          </button>
        </div>
      </Card>
    );
  }

  // 渲染已解锁内容
  return (
    <Card className={`${styles.container} ${className}`}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.content}>
        <div dangerouslySetInnerHTML={{ 
          __html: parseSimpleMarkdown(displayContent) 
        }} />
      </div>
    </Card>
  );
}
