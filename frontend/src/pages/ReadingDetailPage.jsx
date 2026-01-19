/**
 * ReadingDetailPage - AI解读落地页
 * 
 * 支持3种主题：
 * - life-color: 生命底色
 * - special: 专项分析（内含4个Tab）
 * - yearly: 流年运势
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Lock, Sparkle, Coins, Palette, MagnifyingGlass, CalendarBlank, Heart, CurrencyCircleDollar, FirstAidKit, Users } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useToast, LoadingOverlay } from '../components/common';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientBackground from '../components/GradientBackground';
import Card from '../components/common/Card';
import {
    useSubjectDetail,
    useThemePricing,
    useThemes,
    useAsyncUnlock,
} from '../hooks';
import styles from './ReadingDetailPage.module.css';

// 主题配置
const THEME_CONFIG = {
    'life-color': {
        key: 'life_color',
        name: '生命底色',
        description: '探索你的核心性格与天生特质',
        Icon: Palette,
    },
    'special': {
        key: 'special',
        name: '专项分析',
        description: '深入了解人生各领域的解读',
        Icon: MagnifyingGlass,
        tabs: [
            { id: 'relationship', key: 'relationship', name: '亲密关系', Icon: Heart },
            { id: 'career', key: 'career_wealth', name: '事业财富', Icon: CurrencyCircleDollar },
            { id: 'health', key: 'health', name: '身心健康', Icon: FirstAidKit },
            { id: 'life-lesson', key: 'life_lesson', name: '贵人小人', Icon: Users },
        ],
    },
    'yearly': {
        key: 'yearly_fortune',
        name: '流年运势',
        description: '了解今年的机遇与挑战',
        Icon: CalendarBlank,
    },
};

// 其他解读配置（用于快捷切换）
const OTHER_READINGS = [
    { theme: 'life-color', name: '生命底色', Icon: Palette },
    { theme: 'special', name: '专项分析', Icon: MagnifyingGlass },
    { theme: 'yearly', name: '流年运势', Icon: CalendarBlank },
];

// 主题加载文案配置
const LOADING_MESSAGES = {
    'life_color': {
        title: '正在梳理你生命中长期不变的结构与气质。',
        hint: '通常需要1-3分钟，可以去探索其他模块再回来查看哦~',
    },
    'relationship': {
        title: '正在分析你在关系中的靠近方式与边界。',
        hint: '通常需要1-3分钟，可以去探索其他模块再回来查看哦~',
    },
    'career_wealth': {
        title: '正在识别你与现实世界之间的互动节律。',
        hint: '通常需要1-3分钟，可以去探索其他模块再回来查看哦~',
    },
    'health': {
        title: '正在观察你的能量流动与恢复方式。',
        hint: '通常需要1-3分钟，可以去探索其他模块再回来查看哦~',
    },
    'life_lesson': {
        title: '正在整理哪些关系会放大你，哪些会消耗你。',
        hint: '通常需要1-3分钟，可以去探索其他模块再回来查看哦~',
    },
    'yearly_fortune': {
        title: '正在结合大运与流年，聚焦 2026 年最重要的变化。',
        hint: '通常需要1-3分钟，可以去探索其他模块再回来查看哦~',
    },
};

/**
 * 简单的 Markdown 解析
 */
function parseSimpleMarkdown(text) {
    if (!text) return '';

    return text
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>')
        .replace(/^\d\. (.*$)/gm, '<ol><li>$1</li></ol>')
        .replace(/<\/ul>\s*<ul>/g, '')
        .replace(/<\/ol>\s*<ol>/g, '')
        .replace(/\n\n/g, '<br/><br/>');
}

export default function ReadingDetailPage() {
    const { theme } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isLoggedIn, updateUser } = useAuth();
    const toast = useToast();

    const subjectId = searchParams.get('subjectId');
    const tabParam = searchParams.get('tab');

    // 专项分析的当前Tab
    const [activeTab, setActiveTab] = useState(tabParam || 'relationship');

    // 验证主题是否合法
    const themeConfig = THEME_CONFIG[theme];

    // 页面切换时滚动到顶部（解决移动端切换解读模块后页面不在顶部的问题）
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [theme]);

    useEffect(() => {
        if (!themeConfig) {
            navigate('/bazi', { replace: true });
        }
    }, [themeConfig, navigate]);

    useEffect(() => {
        if (!subjectId) {
            navigate('/bazi', { replace: true });
        }
    }, [subjectId, navigate]);

    // 获取数据
    const { data: currentSubject, isLoading: isLoadingSubject } = useSubjectDetail(subjectId, null, {});
    const { data: themePricing = {} } = useThemePricing();
    const { data: themesData = {}, refetch: refetchThemes } = useThemes(subjectId, isLoggedIn, themePricing);

    // 主题名称映射
    const themeNameMap = {
        'life_color': '生命底色',
        'relationship': '亲密关系',
        'career_wealth': '事业财富',
        'health': '身心健康',
        'life_lesson': '贵人小人',
        'yearly_fortune': '流年运势',
    };

    // 异步解锁（任务队列模式）- 每个主题独立状态
    const { unlock, isThemeUnlocking } = useAsyncUnlock({
        onSuccess: (data) => {
            const themeName = themeNameMap[data.theme] || '解读';
            toast.success(`「${themeName}」解锁成功`);
        },
        onError: (error) => {
            if (error.code === 'INSUFFICIENT_POINTS' || error.message?.includes('积分不足')) {
                sessionStorage.setItem('insufficientPointsMessage', '积分不足，请先充值');
                const currentPath = window.location.pathname + window.location.search;
                sessionStorage.setItem('paymentReturnUrl', currentPath);
                navigate('/points');
            } else if (error.code === 'TASK_FAILED') {
                toast.error(error.message || '解锁失败，积分已退还');
                refetchThemes();
            } else {
                toast.error(error.message || '解锁失败');
            }
        },
        updateUser,
    });

    // 获取当前主题数据
    const currentThemeData = useMemo(() => {
        if (!themeConfig) return null;

        if (theme === 'special') {
            // 专项分析：获取当前Tab的数据
            const tabConfig = themeConfig.tabs.find(t => t.id === activeTab);
            if (!tabConfig) return null;
            const pricing = themePricing[tabConfig.key] || {};
            return {
                ...themesData[tabConfig.key],
                themeKey: tabConfig.key,
                name: tabConfig.name,
                price: pricing.price || 0,
                originalPrice: pricing.originalPrice || null,
            };
        } else {
            const pricing = themePricing[themeConfig.key] || {};
            return {
                ...themesData[themeConfig.key],
                themeKey: themeConfig.key,
                name: themeConfig.name,
                price: pricing.price || 0,
                originalPrice: pricing.originalPrice || null,
            };
        }
    }, [theme, themeConfig, themesData, activeTab, themePricing]);

    // 检查当前主题是否正在解锁（放在 currentThemeData 之后）
    const isCurrentThemeUnlocking = currentThemeData?.themeKey
        ? isThemeUnlocking(subjectId, currentThemeData.themeKey)
        : false;

    // 处理解锁
    const handleUnlock = useCallback(() => {
        if (!isLoggedIn) {
            toast.info('请先登录');
            navigate('/login?callbackUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
            return;
        }

        if (!currentThemeData?.themeKey) return;

        unlock({
            subjectId,
            theme: currentThemeData.themeKey,
        });
    }, [isLoggedIn, subjectId, currentThemeData, unlock, navigate, toast]);

    // 处理Tab切换
    const handleTabChange = useCallback((tabId) => {
        setActiveTab(tabId);
        // 更新URL但不刷新页面
        const newUrl = `/bazi/reading/special?subjectId=${subjectId}&tab=${tabId}`;
        window.history.replaceState(null, '', newUrl);
    }, [subjectId]);

    // 加载中
    if (isLoadingSubject || !themeConfig) {
        return <LoadingOverlay fixed text="加载中..." />;
    }

    const subjectName = currentSubject?.name || '命盘';
    const currentYear = new Date().getFullYear();
    const displayName = theme === 'yearly'
        ? `${currentYear}成长建议`
        : themeConfig.name;

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <GradientBackground
                    gridCount={0}
                    glowColors={[
                        'rgba(138, 67, 225, 0.4)',
                        'rgba(94, 106, 210, 0.4)',
                    ]}
                    noiseOpacity={0.12}
                    showTopGradient={true}
                    animated
                />

                <div className={styles.container}>
                    {/* 页头 */}
                    <div className={styles.header}>
                        <Link to={`/bazi?subjectId=${subjectId}`} className={styles.backButton}>
                            <ArrowLeft size={20} />
                            <span>返回命盘</span>
                        </Link>
                        <h1 className={styles.title}>
                            {subjectName}的{displayName}
                        </h1>

                    </div>

                    {/* 专项分析Tab */}
                    {theme === 'special' && (
                        <div className={styles.tabs}>
                            {themeConfig.tabs.map((tab) => {
                                const tabData = themesData[tab.key] || {};
                                const isActive = activeTab === tab.id;
                                const isLocked = !tabData.isUnlocked;

                                return (
                                    <button
                                        key={tab.id}
                                        className={`${styles.tab} ${isActive ? styles.tabActive : ''} ${isLocked ? styles.tabLocked : ''}`}
                                        onClick={() => handleTabChange(tab.id)}
                                    >
                                        <span>{tab.name}</span>
                                        {isLocked && <Lock size={14} weight="fill" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* 内容区域 */}
                    <Card className={styles.contentCard}>
                        {/* 加载中 - 使用当前主题的独立状态 */}
                        {currentThemeData?.isLoading || isCurrentThemeUnlocking ? (() => {
                            const loadingMsg = LOADING_MESSAGES[currentThemeData?.themeKey] || {
                                title: 'AI 正在解读中...',
                                hint: '通常需要1-3分钟，可以去探索其他模块再回来查看哦~',
                            };
                            return (
                                <div className={styles.loading}>
                                    <div className={styles.spinner} />
                                    <span>{loadingMsg.title}</span>
                                    <span className={styles.loadingHint}>{loadingMsg.hint}</span>
                                </div>
                            );
                        })() : currentThemeData?.isUnlocked && currentThemeData?.content ? (
                            <div
                                className={styles.content}
                                dangerouslySetInnerHTML={{
                                    __html: parseSimpleMarkdown(currentThemeData.content)
                                }}
                            />
                        ) : (
                            <div className={styles.locked}>
                                <div className={styles.lockedIcon}>
                                    <Lock size={32} weight="fill" />
                                </div>
                                <h2 className={styles.lockedTitle}>
                                    {currentThemeData?.name || displayName}
                                </h2>
                                <p className={styles.lockedDesc}>
                                    {theme === 'special'
                                        ? `解锁「${currentThemeData?.name}」解读，深入了解这一领域`
                                        : themeConfig.description
                                    }
                                </p>
                                <button
                                    className={styles.unlockButton}
                                    onClick={handleUnlock}
                                    disabled={isCurrentThemeUnlocking}
                                >
                                    <Sparkle weight="fill" size={18} />
                                    <span>解锁解读</span>
                                    <span className={styles.unlockPrice}>
                                        <Coins weight="fill" size={16} />
                                        {currentThemeData?.originalPrice && currentThemeData.originalPrice > (currentThemeData.price || 0) && (
                                            <span className={styles.originalPrice}>{currentThemeData.originalPrice}</span>
                                        )}
                                        <span>{currentThemeData?.price || 0}</span>
                                    </span>
                                </button>
                            </div>
                        )}
                    </Card>

                    {/* 其他解读快捷切换 */}
                    <div className={styles.otherReadings}>
                        <h3 className={styles.otherTitle}>探索更多解读</h3>
                        <div className={styles.otherGrid}>
                            {OTHER_READINGS.filter(r => r.theme !== theme).map((reading) => {
                                // 计算解锁状态
                                let isUnlocked = false;
                                let unlockedCount = 0;
                                let totalCount = 1;

                                if (reading.theme === 'special') {
                                    totalCount = 4;
                                    THEME_CONFIG.special.tabs.forEach(tab => {
                                        if (themesData[tab.key]?.isUnlocked) {
                                            unlockedCount++;
                                        }
                                    });
                                    isUnlocked = unlockedCount > 0;
                                } else {
                                    const key = THEME_CONFIG[reading.theme]?.key;
                                    isUnlocked = themesData[key]?.isUnlocked;
                                }

                                const ReadingIcon = reading.Icon;
                                return (
                                    <Link
                                        key={reading.theme}
                                        to={`/bazi/reading/${reading.theme}?subjectId=${subjectId}`}
                                        className={styles.otherCard}
                                    >
                                        <span className={styles.otherIcon}>
                                            <ReadingIcon size={20} weight="duotone" />
                                        </span>
                                        <span className={styles.otherName}>{reading.name}</span>
                                        {reading.theme === 'special' ? (
                                            <span className={styles.otherStatus}>
                                                {unlockedCount}/{totalCount}
                                            </span>
                                        ) : (
                                            <span className={`${styles.otherStatus} ${isUnlocked ? styles.unlocked : ''}`}>
                                                {isUnlocked ? '已解锁' : '待解锁'}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
