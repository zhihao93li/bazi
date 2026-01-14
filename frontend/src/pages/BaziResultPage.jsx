import { useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { m } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast, LoadingOverlay } from '../components/common';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientBackground from '../components/GradientBackground';
import { getLocalSubjects } from './BaziInputPage';

// Query Hooks
import {
  useSubjects,
  useSyncLocalSubject,
  useDeleteSubject,
  useSubjectDetail,
  useThemePricing,
  useThemes,
  useUnlockTheme,
  useSubjectSwitchEffect,
} from '../hooks';

// 核心业务组件
import BaziChartCard from '../components/bazi/BaziChartCard';
import SubjectSwitcher from '../components/bazi/SubjectSwitcher';

// 新版主题解读组件
import LifeColorCard from '../components/bazi/LifeColorCard';
import SpecialAnalysisCard from '../components/bazi/SpecialAnalysisCard';
import YearlyFortuneCard from '../components/bazi/YearlyFortuneCard';

import styles from './BaziResultPage.module.css';

/**
 * 专项分析的主题列表
 */
const SPECIAL_THEMES = ['relationship', 'career_wealth', 'health', 'life_lesson'];

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
};

export default function BaziResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, updateUser } = useAuth();
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
      result[theme] = {
        ...result[theme],
        ...(themesData?.[theme] || {}),
        price: themePricing[theme]?.price || 0,
      };
    });
    return result;
  }, [themesData, themePricing]);

  // ==================== Mutations ====================

  // 同步本地命盘
  const syncLocalSubject = useSyncLocalSubject();

  // 删除命盘
  const deleteSubjectMutation = useDeleteSubject();

  // 解锁主题
  const unlockThemeMutation = useUnlockTheme({
    onSuccess: (data, { theme }) => {
      toast.success(`「${themePricing[theme]?.name || theme}」解锁成功`);
    },
    onError: (error, { theme }) => {
      if (error.code === 'INSUFFICIENT_POINTS') {
        toast.error('积分不足，请先充值');
        navigate('/points');
      } else if (error.code === 'ALREADY_UNLOCKED') {
        // 已解锁，静默处理（Query 会自动刷新数据）
      } else {
        toast.error(error.message || '解锁失败');
      }
    },
    updateUser,
  });

  // ==================== 副作用处理 ====================

  // 处理命盘详情加载错误
  useEffect(() => {
    if (isSubjectError) {
      toast.error('获取命盘失败');
      navigate('/bazi/input');
    }
  }, [isSubjectError, toast, navigate]);

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

  // 登录后自动同步本地命盘到后端
  useEffect(() => {
    if (!isLoggedIn || !localId || !subjectsLoaded || syncLocalSubject.isPending) return;

    const localSubjects = getLocalSubjects();
    const localSubject = localSubjects.find(s => s.id === localId);

    if (!localSubject) return;

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
  }, [isLoggedIn, localId, subjectsLoaded, syncLocalSubject, setSearchParams, toast]);

  // ==================== 事件处理 ====================

  // 处理主题解锁
  const handleUnlockTheme = useCallback((theme) => {
    if (!isLoggedIn) {
      toast.info('请先登录以使用 AI 解读');
      navigate('/login?callbackUrl=' + encodeURIComponent(location.pathname + location.search));
      return;
    }

    if (!subjectId) {
      toast.info('本地命盘需要先同步到云端才能使用 AI 解读');
      return;
    }

    // 检查该主题是否已经在加载中
    if (themesDataWithPricing[theme]?.isLoading) {
      return; // 静默忽略，该主题已在加载
    }

    unlockThemeMutation.mutate({ subjectId, theme });
  }, [isLoggedIn, subjectId, unlockThemeMutation, themesDataWithPricing, toast, navigate, location]);

  // 处理命盘切换
  const handleSwitchSubject = useCallback((subject) => {
    if (subject.isLocal) {
      setSearchParams({ localId: subject.id });
    } else {
      setSearchParams({ subjectId: subject.id });
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
            navigate('/bazi/input');
          }
        },
        onError: (error) => {
          toast.error(error.message || '删除失败');
        },
      }
    );
  }, [subjects, currentSubject, deleteSubjectMutation, toast, navigate]);

  // ==================== 计算派生数据 ====================

  // 构建专项分析的数据
  const specialAnalysisData = useMemo(() => {
    const data = {};
    SPECIAL_THEMES.forEach(theme => {
      data[theme] = themesDataWithPricing[theme];
    });
    return data;
  }, [themesDataWithPricing]);

  // 八字数据
  const baziResult = currentSubject?.baziData;

  const baziGlowColors = [
    'rgba(138, 67, 225, 0.5)',
    'rgba(94, 106, 210, 0.5)',
    'rgba(239, 123, 22, 0.4)',
  ];

  // ==================== 渲染 ====================

  // 加载中状态
  if (isLoadingSubjects || isLoadingSubject || !baziResult) {
    return <LoadingOverlay fixed text="加载中..." />;
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
          <div className={styles.topBar}>
            <h1 className={styles.title}>命盘解读</h1>
          </div>

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
                isSaved={!currentSubject?.isLocal}
              />
            </m.div>

            {/* 右侧：AI 解读卡片（三个并列） */}
            <m.div
              className={styles.rightCol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className={styles.themeCardsWrapper}>
                {/* 生命底色 */}
                <LifeColorCard
                  isUnlocked={themesDataWithPricing.life_color.isUnlocked}
                  content={themesDataWithPricing.life_color.content}
                  price={themesDataWithPricing.life_color.price}
                  isLoading={themesDataWithPricing.life_color.isLoading}
                  onUnlock={handleUnlockTheme}
                />

                {/* 专项分析（4个tab） */}
                <SpecialAnalysisCard
                  themesData={specialAnalysisData}
                  onUnlock={handleUnlockTheme}
                />

                {/* 流年解读 */}
                <YearlyFortuneCard
                  isUnlocked={themesDataWithPricing.yearly_fortune.isUnlocked}
                  content={themesDataWithPricing.yearly_fortune.content}
                  price={themesDataWithPricing.yearly_fortune.price}
                  isLoading={themesDataWithPricing.yearly_fortune.isLoading}
                  onUnlock={handleUnlockTheme}
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
