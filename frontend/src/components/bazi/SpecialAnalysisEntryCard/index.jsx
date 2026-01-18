/**
 * SpecialAnalysisEntryCard - 专项分析入口卡片
 * 
 * 显示4个子主题的2x2网格，点击各自跳转到对应Tab
 */

import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Lock, Heart, CurrencyCircleDollar, FirstAidKit, Users, MagnifyingGlass } from '@phosphor-icons/react';
import { useToast } from '../../common';
import Card from '../../common/Card';
import styles from './SpecialAnalysisEntryCard.module.css';

// 子主题配置
const SPECIAL_THEMES = [
    { id: 'relationship', key: 'relationship', name: '亲密关系', Icon: Heart },
    { id: 'career', key: 'career_wealth', name: '事业财富', Icon: CurrencyCircleDollar },
    { id: 'health', key: 'health', name: '身心健康', Icon: FirstAidKit },
    { id: 'life-lesson', key: 'life_lesson', name: '贵人小人', Icon: Users },
];

export default function SpecialAnalysisEntryCard({
    themesData = {},
    subjectId,
    className = '',
}) {
    const navigate = useNavigate();
    const toast = useToast();

    // 检查是否是本地命盘（未登录用户）
    const isLocalSubject = subjectId?.startsWith('local_');

    // 计算解锁数量
    const unlockedCount = SPECIAL_THEMES.filter(
        t => themesData[t.key]?.isUnlocked
    ).length;

    const handleClick = (e) => {
        if (isLocalSubject) {
            e.preventDefault();
            toast.info('请先登录以使用解读功能');
            navigate('/login?callbackUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
        }
    };

    return (
        <Card className={`${styles.card} ${className}`}>
            <div className={styles.header}>
                <span className={styles.icon}>
                    <MagnifyingGlass size={22} weight="duotone" />
                </span>
                <h3 className={styles.title}>专项分析</h3>
                <span className={styles.status}>{unlockedCount}/4</span>
            </div>

            <div className={styles.grid}>
                {SPECIAL_THEMES.map((theme) => {
                    const data = themesData[theme.key] || {};
                    const isUnlocked = data.isUnlocked;
                    const linkTo = isLocalSubject ? '#' : `/bazi/reading/special?subjectId=${subjectId}&tab=${theme.id}`;
                    const ThemeIcon = theme.Icon;

                    return (
                        <Link
                            key={theme.id}
                            to={linkTo}
                            className={`${styles.item} ${isUnlocked ? styles.unlocked : ''}`}
                            onClick={handleClick}
                        >
                            <span className={styles.itemIcon}>
                                <ThemeIcon size={24} weight="duotone" />
                            </span>
                            <span className={styles.itemName}>{theme.name}</span>
                            {!isUnlocked && (
                                <Lock className={styles.lockIcon} size={12} weight="fill" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </Card>
    );
}

