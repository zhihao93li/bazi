import { useState, useEffect, useRef, useCallback } from 'react';
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
    // 防止重复点击
    if (isClicking || isLoading) return;
    
    setIsClicking(true);
    onUnlock?.(theme);
    
    // 3秒后重置点击状态（作为兜底，正常情况下 isLoading 会变为 true）
    clickTimeoutRef.current = setTimeout(() => {
      setIsClicking(false);
    }, 3000);
  }, [isClicking, isLoading, onUnlock, theme]);

  useEffect(() => {
    if (content) {
      setDisplayContent(content);
    }
  }, [content]);

  // 渲染加载状态
  if (isLoading) {
    return (
      <Card className={`${styles.container} ${className}`}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>AI 正在解读中，请稍候...</span>
        </div>
      </Card>
    );
  }

  // 渲染锁定状态
  if (!isUnlocked) {
    const isDisabled = isClicking || isLoading;
    
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
            disabled={isDisabled}
          >
            <Sparkle weight="fill" size={16} />
            <span>{isClicking ? '请求中...' : '解锁解读'}</span>
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
