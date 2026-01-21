import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { Palette, CalendarBlank, Users, MusicNotes } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useToast, LoadingOverlay } from '../components/common';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientBackground from '../components/GradientBackground';
import { getLocalSubjects } from '../utils/localSubjects';

// Query Hooks
import {
  useSubjects,
  useSyncLocalSubject,
  useDeleteSubject,
  useSubjectDetail,
  useThemePricing,
  useThemes,
  useSubjectSwitchEffect,
} from '../hooks';

// 核心业务组件
import BaziChartCard from '../components/bazi/BaziChartCard';
import SubjectSwitcher from '../components/bazi/SubjectSwitcher';

// 解读入口卡片组件
import ReadingEntryCard from '../components/bazi/ReadingEntryCard';
import SpecialAnalysisEntryCard from '../components/bazi/SpecialAnalysisEntryCard';

import styles from './BaziResultPage.module.css';

/**
 * 解读卡片描述文案
 */
const READING_DESCRIPTIONS = {
  life_color: '探索你的核心性格与天生特质',
  yearly_fortune: '了解今年的机遇与挑战',
  synastry: '双人关系深度解读',
  soul_song: '发现与你灵魂共振的音乐',
};

/**
 * 默认主题数据（用于未登录或无数据时）
 */
const DEFAULT_THEMES_DATA = {
  life_color: { isUnlocked: false, content: null, price: 0 },
  relationship: { isUnlocked: false, content: null, price: 0 },
  career_wealth: { isUnlocked: false, content: null, price: 0 },
  health: { isUnlocked: false, content: null, price: 0 },
  life_lesson: { isUnlocked: false, content: null, price: 0 },
  yearly_fortune: { isUnlocked: false, content: null, price: 0 },
  synastry: { isUnlocked: false, content: null, price: 0 },
  soul_song: { isUnlocked: false, content: null, price: 100 },
};

export default function BaziResultPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn } = useAuth();
  const toast = useToast();

  // 从 URL 获取参数
  const subjectId = searchParams.get('subjectId');
  const localId = searchParams.get('localId');

  // 切换命盘时自动取消旧请求
  useSubjectSwitchEffect(subjectId, localId);

  // ==================== Query Hooks ====================

  // 1. 获取命盘列表
  const {
    data: subjects = [],
    isLoading: isLoadingSubjects,
    isSuccess: subjectsLoaded,
  } = useSubjects(isLoggedIn);

  // 2. 获取主题价格配置
  const { data: themePricing = {} } = useThemePricing();

  // 3. 获取命盘详情
  const {
    data: currentSubject,
    isLoading: isLoadingSubject,
    isError: isSubjectError,
  } = useSubjectDetail(subjectId, localId, { subjects });

  // 4. 获取主题状态和内容
  const {
    data: themesData = DEFAULT_THEMES_DATA,
  } = useThemes(subjectId, isLoggedIn, themePricing);

  // 合并价格信息到主题数据
  const themesDataWithPricing = useMemo(() => {
    const result = { ...DEFAULT_THEMES_DATA };
    Object.keys(result).forEach(theme => {
      // 确保后端返回了该主题的数据，如果没有则使用默认值
      const backendData = themesData?.[theme] || {};
      const pricingInfo = themePricing[theme] || {};

      result[theme] = {
        ...result[theme],
        ...backendData,
        price: pricingInfo.price || 0,
        originalPrice: pricingInfo.originalPrice || null,
      };
    });
    return result;
  }, [themesData, themePricing]);

  // ==================== Mutations ====================

  // 同步本地命盘
  const syncLocalSubject = useSyncLocalSubject();

  // 删除命盘
  const deleteSubjectMutation = useDeleteSubject();

  // 解锁主题已移至 ReadingDetailPage 落地页处理

  // ==================== 副作用处理 ====================

  // 处理命盘详情加载错误
  useEffect(() => {
    if (isSubjectError) {
      toast.error('获取命盘失败');
      // 清除URL参数，让下面的自动导航逻辑处理（选择第一个命盘或跳转到输入页）
      setSearchParams({}, { replace: true });
    }
  }, [isSubjectError, toast, setSearchParams]);

  // 自动导航到第一个命盘或输入页（当没有选中任何命盘时）
  useEffect(() => {
    if (!subjectsLoaded || subjectId || localId) return;

    if (subjects.length > 0) {
      const firstSubject = subjects[0];
      if (firstSubject.isLocal) {
        setSearchParams({ localId: firstSubject.id }, { replace: true });
      } else {
        setSearchParams({ subjectId: firstSubject.id }, { replace: true });
      }
    } else if (isLoadingSubjects === false) {
      // 没有任何命盘，跳转到输入页
      navigate('/bazi/input', { replace: true });
    }
  }, [subjectsLoaded, subjects, subjectId, localId, isLoadingSubjects, setSearchParams, navigate]);

  // 记录已尝试同步的本地命盘 ID，避免重复请求
  const syncAttemptedRef = useRef(new Set());

  // 登录后自动同步本地命盘到后端
  useEffect(() => {
    if (!isLoggedIn || !localId || !subjectsLoaded || syncLocalSubject.isPending) return;

    // 如果已经尝试过同步这个 localId，则跳过
    if (syncAttemptedRef.current.has(localId)) return;

    const localSubjects = getLocalSubjects();
    const localSubject = localSubjects.find(s => s.id === localId);

    if (!localSubject) return;

    // 标记为已尝试同步
    syncAttemptedRef.current.add(localId);

    syncLocalSubject.mutate(localSubject, {
      onSuccess: ({ newSubject }) => {
        // 更新 URL 参数为 subjectId
        setSearchParams({ subjectId: newSubject.id }, { replace: true });
        toast.success('命盘已同步到云端');
      },
      onError: (error) => {
        if (error.code === 'NAME_DUPLICATE') {
          toast.error('该称呼已存在，本地命盘未同步');
        } else {
          console.error('Sync local subject error:', error);
        }
      },
    });
  }, [isLoggedIn, localId, subjectsLoaded, syncLocalSubject.isPending, setSearchParams, toast]);

  // ==================== 事件处理 ====================

  // 处理命盘切换
  const handleSwitchSubject = useCallback((subject) => {
    if (subject.isLocal) {
      setSearchParams({ localId: subject.id }, { replace: true });
    } else {
      setSearchParams({ subjectId: subject.id }, { replace: true });
    }
  }, [setSearchParams]);

  // 处理删除命盘
  const handleDeleteSubject = useCallback(async (id) => {
    const subject = subjects.find(s => s.id === id);
    if (!subject) return;

    deleteSubjectMutation.mutate(
      { id, isLocal: subject.isLocal },
      {
        onSuccess: () => {
          toast.success('删除成功');
          if (currentSubject?.id === id) {
            // 清除URL参数，让自动导航逻辑处理（选择其他命盘或跳转到输入页）
            setSearchParams({}, { replace: true });
          }
        },
        onError: (error) => {
          toast.error(error.message || '删除失败');
        },
      }
    );
  }, [subjects, currentSubject, deleteSubjectMutation, toast, setSearchParams]);

  // ==================== 计算派生数据 ====================

  // 获取当前年份（用于流年解读标题）
  const currentYear = new Date().getFullYear();

  // 八字数据
  const baziResult = currentSubject?.baziData;

  const baziGlowColors = [
    'rgba(138, 67, 225, 0.5)',
    'rgba(94, 106, 210, 0.5)',
    'rgba(239, 123, 22, 0.4)',
  ];

  // 使用有效的 subjectId（优先云端，其次本地）
  const effectiveSubjectId = subjectId || localId;

  // 检查是否正在同步本地命盘
  const isSyncingLocal = isLoggedIn && localId && !subjectId && syncLocalSubject.isPending;

  // ==================== 渲染 ====================

  // 加载中状态（包括同步中）
  if (isLoadingSubjects || isLoadingSubject || !baziResult || isSyncingLocal) {
    return <LoadingOverlay fixed text={isSyncingLocal ? "正在同步命盘..." : "加载中..."} />;
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <GradientBackground
          gridCount={0}
          glowColors={baziGlowColors}
          noiseOpacity={0.15}
          showTopGradient={true}
          showBottomGradient={true}
          animated
          expanded
        />

        <div className={styles.container}>

          {/* 顶部标题 */}
          {/* <div className={styles.topBar}>
            <h1 className={styles.title}>命盘解读</h1>
          </div> */}

          {/* 对象切换器（平铺胶囊按钮） */}
          {subjects.length > 0 && (
            <div className={styles.subjectSwitcherBar}>
              <SubjectSwitcher
                currentSubject={currentSubject}
                subjects={subjects}
                onSelect={handleSwitchSubject}
                onDelete={handleDeleteSubject}
              />
            </div>
          )}

          {/* 核心内容网格 */}
          <div className={styles.contentGrid}>

            {/* 左侧：命盘卡片 */}
            <m.div
              className={styles.leftCol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <BaziChartCard
                data={baziResult}
                subject={currentSubject}
                trueSolarTime={baziResult?.trueSolarTime}
                isSaved={!currentSubject?.isLocal}
              />
            </m.div>

            {/* 右侧：AI 解读入口卡片 */}
            <m.div
              className={styles.rightCol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className={styles.themeCardsWrapper}>
                {/* 生命底色入口 */}
                <ReadingEntryCard
                  theme="life-color"
                  title="生命底色"
                  icon={Palette}
                  content={themesDataWithPricing.life_color.content}
                  description={READING_DESCRIPTIONS.life_color}
                  isUnlocked={themesDataWithPricing.life_color.isUnlocked}
                  price={themesDataWithPricing.life_color.price}
                  subjectId={effectiveSubjectId}
                />

                {/* 专项分析入口（2x2网格） */}
                <SpecialAnalysisEntryCard
                  themesData={themesDataWithPricing}
                  subjectId={effectiveSubjectId}
                />

                {/* 流年解读入口 */}
                <ReadingEntryCard
                  theme="yearly"
                  title={`${currentYear}成长建议`}
                  icon={CalendarBlank}
                  content={themesDataWithPricing.yearly_fortune.content}
                  description={READING_DESCRIPTIONS.yearly_fortune}
                  isUnlocked={themesDataWithPricing.yearly_fortune.isUnlocked}
                  price={themesDataWithPricing.yearly_fortune.price}
                  originalPrice={themesDataWithPricing.yearly_fortune.originalPrice}
                  subjectId={effectiveSubjectId}
                />

                {/* 解锁灵魂歌曲入口 */}
                <ReadingEntryCard
                  theme="soul-song"
                  title="解锁灵魂歌曲"
                  icon={MusicNotes}
                  description={READING_DESCRIPTIONS.soul_song}
                  isUnlocked={themesDataWithPricing.soul_song?.isUnlocked}
                  price={themesDataWithPricing.soul_song?.price || 100}
                  subjectId={effectiveSubjectId}
                />

                {/* 合盘分析入口 (即将推出) */}
                <ReadingEntryCard
                  theme="synastry"
                  title="合盘分析"
                  icon={Users}
                  description={READING_DESCRIPTIONS.synastry}
                  price={themesDataWithPricing.synastry.price}
                  comingSoon={true}
                  subjectId={effectiveSubjectId}
                />
              </div>
            </m.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
