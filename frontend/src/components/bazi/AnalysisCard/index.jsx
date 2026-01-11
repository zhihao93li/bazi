import { useState, useEffect } from 'react';
import { Sparkle, LockKey } from '@phosphor-icons/react';
// import ReactMarkdown from 'react-markdown'; // Assuming we might want to add this, but for now simple rendering
import Card from '../../common/Card';
import styles from './AnalysisCard.module.css';

const TABS = [
  { id: 'summary', label: '综合分析' },
  { id: 'personality', label: '性格特质' },
  { id: 'career', label: '事业发展' },
  { id: 'wealth', label: '财运分析' },
  { id: 'relationship', label: '感情运势' },
];

export default function AnalysisCard({ 
  data, 
  isLoading = false, 
  onStartAnalysis,
  className = '' 
}) {
  const [activeTab, setActiveTab] = useState('summary');
  const [displayContent, setDisplayContent] = useState('');

  // Typing effect or simple transition when tab changes
  useEffect(() => {
    if (data && data[activeTab]) {
      setDisplayContent(data[activeTab]);
    }
  }, [data, activeTab]);

  // Render Prompt State
  if (!data && !isLoading) {
    return (
      <Card className={`${styles.container} ${className}`}>
        <div className={styles.promptContainer}>
          <div className={styles.promptIcon}>
            <Sparkle size={32} weight="fill" />
          </div>
          <h3 className={styles.promptTitle}>AI 命理深度解读</h3>
          <p className={styles.promptDesc}>
            基于您的八字命盘，利用 AI 引擎进行多维度的深度性格与运势分析。
          </p>
          <button 
            className={styles.startButton}
            onClick={onStartAnalysis}
          >
            <Sparkle size={18} weight="fill" />
            开始解读 (消耗 1 积分)
          </button>
        </div>
      </Card>
    );
  }

  // Render Loading State
  if (isLoading) {
    return (
      <Card className={`${styles.container} ${className}`}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>AI 正在解读命盘，请稍候...</span>
        </div>
      </Card>
    );
  }

  // Render Content State
  return (
    <Card className={`${styles.container} ${className}`}>
      {/* Tabs Header */}
      <div className={styles.header}>
        {TABS.map((tab) => (
          <div
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Content Body */}
      <div className={styles.content}>
         {/* Simple Markdown Renderer simulation */}
         {/* In a real app, use <ReactMarkdown>{displayContent}</ReactMarkdown> */}
         <div dangerouslySetInnerHTML={{ 
           __html: parseSimpleMarkdown(displayContent) 
         }} />
      </div>
    </Card>
  );
}

// Simple helper to convert our mock markdown-like text to HTML
// In production, install 'react-markdown'
function parseSimpleMarkdown(text) {
  if (!text) return '';
  
  let html = text
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Lists
    .replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>')
    .replace(/^\d\. (.*$)/gm, '<ul><li>$1</li></ul>')
    // Fix ul nesting (naive approach)
    .replace(/<\/ul>\s*<ul>/g, '')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '<br/><br/>');
    
  return html;
}
