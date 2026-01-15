/**
 * ReadingEntryCard - 解读入口卡片
 * 
 * 用于在命盘主页显示解读入口，点击跳转到落地页
 */

import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from '@phosphor-icons/react';
import Card from '../../common/Card';
import styles from './ReadingEntryCard.module.css';

/**
 * 截取摘要文本
 */
function truncateSummary(text, maxLength = 80) {
    if (!text) return '';
    // 移除Markdown标记
    const cleanText = text
        .replace(/^#+\s/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^[-*]\s/gm, '')
        .replace(/\n/g, ' ')
        .trim();

    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.slice(0, maxLength) + '...';
}

export default function ReadingEntryCard({
    theme,
    title,
    icon: IconComponent,
    content,
    description,
    isUnlocked = false,
    price = 0,
    subjectId,
    className = '',
}) {
    const summary = truncateSummary(content);
    const linkTo = `/bazi/reading/${theme}?subjectId=${subjectId}`;

    return (
        <Card className={`${styles.card} ${className}`}>
            <Link to={linkTo} className={styles.link}>
                <div className={styles.header}>
                    <span className={styles.icon}>
                        {IconComponent && <IconComponent size={22} weight="duotone" />}
                    </span>
                    <h3 className={styles.title}>{title}</h3>
                    {isUnlocked ? (
                        <span className={styles.statusUnlocked}>已解锁</span>
                    ) : (
                        <span className={styles.statusLocked}>
                            <Lock size={12} weight="fill" />
                            {price}积分
                        </span>
                    )}
                </div>

                <p className={styles.description}>
                    {isUnlocked && summary ? summary : description}
                </p>

                <div className={styles.action}>
                    <span>{isUnlocked ? '查看完整解读' : '了解更多'}</span>
                    <ArrowRight size={16} />
                </div>
            </Link>
        </Card>
    );
}
