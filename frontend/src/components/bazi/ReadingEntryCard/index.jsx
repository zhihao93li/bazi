/**
 * ReadingEntryCard - 解读入口卡片
 * 
 * 用于在命盘主页显示解读入口，点击跳转到落地页
 */

import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from '@phosphor-icons/react';
import { useToast } from '../../common';
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
    originalPrice = null,
    comingSoon = false,
    subjectId,
    className = '',
}) {
    const navigate = useNavigate();
    const toast = useToast();
    const summary = truncateSummary(content);

    // 检查是否是本地命盘（未登录用户）
    const isLocalSubject = subjectId?.startsWith('local_');
    const isDisabled = comingSoon || isLocalSubject;

    // 灵魂歌曲使用专门的页面
    const getLinkTo = () => {
        if (isDisabled) return '#';
        if (theme === 'soul-song') {
            return `/bazi/soul-song?subjectId=${subjectId}`;
        }
        return `/bazi/reading/${theme}?subjectId=${subjectId}`;
    };
    const linkTo = getLinkTo();

    const handleClick = (e) => {
        if (comingSoon) {
            e.preventDefault();
            return;
        }
        if (isLocalSubject) {
            e.preventDefault();
            toast.info('请先登录以使用解读功能');
            navigate('/login?callbackUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
        }
    };

    return (
        <Card className={`${styles.card} ${className} ${comingSoon ? styles.disabled : ''}`}>
            <Link to={linkTo} className={styles.link} onClick={handleClick}>
                <div className={styles.header}>
                    <span className={styles.icon}>
                        {IconComponent && <IconComponent size={22} weight="duotone" />}
                    </span>
                    <h3 className={styles.title}>{title}</h3>
                    {comingSoon ? (
                        <span className={styles.comingSoonBadge}>即将推出</span>
                    ) : isUnlocked ? (
                        <span className={styles.statusUnlocked}>已解锁</span>
                    ) : (
                        <span className={styles.statusLocked}>
                            <Lock size={12} weight="fill" />
                            {originalPrice && originalPrice > price && (
                                <span className={styles.originalPrice}>{originalPrice}</span>
                            )}
                            <span className={originalPrice ? styles.discountPrice : ''}>
                                {price}积分
                            </span>
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

