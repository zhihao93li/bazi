import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast, LoadingOverlay } from '../components/common';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientBackground from '../components/GradientBackground';
import { api } from '../services/api';
import { getLocalSubjects, deleteLocalSubject } from './BaziInputPage';

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

export default function BaziResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, updateUser } = useAuth();
  const toast = useToast();

  // 基础状态
  const [currentSubject, setCurrentSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [baziResult, setBaziResult] = useState(null);

  // 主题相关状态
  const [themePricing, setThemePricing] = useState({});
  const [themesData, setThemesData] = useState({
    life_color: { isUnlocked: false, content: null, price: 0 },
    relationship: { isUnlocked: false, content: null, price: 0 },
    career_wealth: { isUnlocked: false, content: null, price: 0 },
    health: { isUnlocked: false, content: null, price: 0 },
    life_lesson: { isUnlocked: false, content: null, price: 0 },
    yearly_fortune: { isUnlocked: false, content: null, price: 0 },
  });
  const [loadingTheme, setLoadingTheme] = useState(null);

  // 获取 subjectId
  const getSubjectId = useCallback(() => {
    return searchParams.get('subjectId');
  }, [searchParams]);

  // 加载主题价格配置
  const loadThemePricing = useCallback(async () => {
    try {
      const res = await api.get('/themes/pricing');
      const pricing = {};
      (res.pricing || []).forEach(p => {
        pricing[p.theme] = p;
      });
      setThemePricing(pricing);
      
      // 更新各主题的价格
      setThemesData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(theme => {
          if (pricing[theme]) {
            updated[theme] = { ...updated[theme], price: pricing[theme].price };
          }
        });
        return updated;
      });
    } catch (error) {
      console.error('Failed to load theme pricing:', error);
    }
  }, []);

  // 加载主题解锁状态
  const loadThemeStatus = useCallback(async (subjectId) => {
    if (!subjectId || !isLoggedIn) return;
    
    try {
      const res = await api.get(`/themes/status/${subjectId}`);
      const status = res.status || [];
      
      setThemesData(prev => {
        const updated = { ...prev };
        status.forEach(s => {
          if (updated[s.theme]) {
            updated[s.theme] = {
              ...updated[s.theme],
              isUnlocked: s.isUnlocked,
            };
          }
        });
        return updated;
      });

      // 如果有已解锁的主题，加载它们的内容
      const unlockedThemes = status.filter(s => s.isUnlocked);
      if (unlockedThemes.length > 0) {
        const batchRes = await api.post('/themes/batch', {
          subjectId,
          themes: unlockedThemes.map(s => s.theme),
        });
        
        setThemesData(prev => {
          const updated = { ...prev };
          (batchRes.themes || []).forEach(t => {
            if (updated[t.theme]) {
              updated[t.theme] = {
                ...updated[t.theme],
                isUnlocked: t.isUnlocked,
                content: t.content,
              };
            }
          });
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to load theme status:', error);
    }
  }, [isLoggedIn]);

  // 1. 初始化数据
  useEffect(() => {
    const subjectId = searchParams.get('subjectId');
    const localId = searchParams.get('localId');

    // 加载所有命盘并处理当前显示
    const loadAndInit = async () => {
      let allSubjects = [];
      
      // 加载本地命盘
      const localSubjects = getLocalSubjects();
      allSubjects = [...localSubjects];
      
      // 如果已登录，加载后端命盘
      if (isLoggedIn) {
        try {
          const res = await api.get('/subjects');
          allSubjects = [...allSubjects, ...(res.subjects || [])];
        } catch (e) {
          // 忽略错误
        }
      }
      
      setSubjects(allSubjects);

      // 加载当前命盘数据
      if (subjectId) {
        // 后端命盘
        try {
          const res = await api.get(`/subjects/${subjectId}`);
          setCurrentSubject(res.subject);
          setBaziResult(res.subject.baziData);
          // 加载主题状态
          loadThemeStatus(subjectId);
        } catch {
          toast.error('获取命盘失败');
          navigate('/bazi/input');
        }
      } else if (localId) {
        // 本地命盘
        const localSubject = localSubjects.find(s => s.id === localId);
        if (localSubject) {
          setCurrentSubject(localSubject);
          setBaziResult(localSubject.baziData);
        } else {
          toast.error('未找到本地命盘');
          navigate('/bazi/input');
        }
      } else {
        // 没有参数：自动加载第一个命盘，或跳转到输入页
        if (allSubjects.length > 0) {
          const firstSubject = allSubjects[0];
          if (firstSubject.isLocal) {
            setSearchParams({ localId: firstSubject.id }, { replace: true });
          } else {
            setSearchParams({ subjectId: firstSubject.id }, { replace: true });
          }
        } else {
          // 没有任何命盘，跳转到输入页
          navigate('/bazi/input', { replace: true });
        }
      }
    };
    
    loadAndInit();
  }, [searchParams, isLoggedIn, navigate, toast, setSearchParams, loadThemeStatus]);

  // 2. 加载主题价格
  useEffect(() => {
    loadThemePricing();
  }, [loadThemePricing]);

  // 3. 处理主题解锁
  const handleUnlockTheme = async (theme) => {
    const subjectId = getSubjectId();
    
    if (!isLoggedIn) {
      toast.info('请先登录以使用 AI 解读');
      navigate('/login?callbackUrl=' + encodeURIComponent(location.pathname + location.search));
      return;
    }
    
    if (!subjectId) {
      // 本地命盘需要先同步
      toast.info('本地命盘需要先同步到云端才能使用 AI 解读');
      return;
    }
    
    setLoadingTheme(theme);
    
    try {
      const res = await api.post('/themes/unlock', {
        subjectId,
        theme,
      });
      
      // 更新主题数据
      setThemesData(prev => ({
        ...prev,
        [theme]: {
          ...prev[theme],
          isUnlocked: true,
          content: res.content,
        },
      }));
      
      // 更新用户余额
      updateUser({ balance: res.remainingBalance });
      toast.success(`「${themePricing[theme]?.name || theme}」解锁成功`);
    } catch (error) {
      if (error.code === 'INSUFFICIENT_POINTS') {
        toast.error('积分不足，请先充值');
        navigate('/points');
      } else if (error.code === 'ALREADY_UNLOCKED') {
        // 已解锁，重新加载内容
        loadThemeStatus(subjectId);
      } else {
        toast.error(error.message || '解锁失败');
      }
    } finally {
      setLoadingTheme(null);
    }
  };

  // 4. 处理命盘切换
  const handleSwitchSubject = (subject) => {
    // 重置主题数据
    setThemesData({
      life_color: { isUnlocked: false, content: null, price: themePricing.life_color?.price || 0 },
      relationship: { isUnlocked: false, content: null, price: themePricing.relationship?.price || 0 },
      career_wealth: { isUnlocked: false, content: null, price: themePricing.career_wealth?.price || 0 },
      health: { isUnlocked: false, content: null, price: themePricing.health?.price || 0 },
      life_lesson: { isUnlocked: false, content: null, price: themePricing.life_lesson?.price || 0 },
      yearly_fortune: { isUnlocked: false, content: null, price: themePricing.yearly_fortune?.price || 0 },
    });
    
    if (subject.isLocal) {
      setSearchParams({ localId: subject.id });
    } else {
      setSearchParams({ subjectId: subject.id });
    }
  };

  // 5. 处理删除命盘
  const handleDeleteSubject = async (id) => {
    const subject = subjects.find(s => s.id === id);
    
    if (subject?.isLocal) {
      deleteLocalSubject(id);
      setSubjects(prev => prev.filter(s => s.id !== id));
      toast.success('删除成功');
    } else {
      try {
        await api.delete(`/subjects/${id}`);
        setSubjects(prev => prev.filter(s => s.id !== id));
        toast.success('删除成功');
      } catch (error) {
        toast.error(error.message || '删除失败');
        return;
      }
    }
    
    if (currentSubject?.id === id) {
      navigate('/bazi/input');
    }
  };

  // 构建专项分析的数据
  const specialAnalysisData = {};
  SPECIAL_THEMES.forEach(theme => {
    specialAnalysisData[theme] = themesData[theme];
  });

  const baziGlowColors = [
    'rgba(138, 67, 225, 0.5)',
    'rgba(94, 106, 210, 0.5)',
    'rgba(239, 123, 22, 0.4)',
  ];

  if (!baziResult) {
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
            <motion.div 
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
            </motion.div>

            {/* 右侧：AI 解读卡片（三个并列） */}
            <motion.div 
              className={styles.rightCol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className={styles.themeCardsWrapper}>
                {/* 生命底色 */}
                <LifeColorCard
                  isUnlocked={themesData.life_color.isUnlocked}
                  content={themesData.life_color.content}
                  price={themesData.life_color.price}
                  isLoading={loadingTheme === 'life_color'}
                  onUnlock={handleUnlockTheme}
                />

                {/* 专项分析（4个tab） */}
                <SpecialAnalysisCard
                  themesData={specialAnalysisData}
                  loadingTheme={loadingTheme}
                  onUnlock={handleUnlockTheme}
                />

                {/* 流年解读 */}
                <YearlyFortuneCard
                  isUnlocked={themesData.yearly_fortune.isUnlocked}
                  content={themesData.yearly_fortune.content}
                  price={themesData.yearly_fortune.price}
                  isLoading={loadingTheme === 'yearly_fortune'}
                  onUnlock={handleUnlockTheme}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
