import { useState, useEffect } from 'react';
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
import AnalysisCard from '../components/bazi/AnalysisCard';
import SubjectSwitcher from '../components/bazi/SubjectSwitcher';

import styles from './BaziResultPage.module.css';

export default function BaziResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, updateUser } = useAuth();
  const toast = useToast();

  const [currentSubject, setCurrentSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [baziResult, setBaziResult] = useState(null);

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
  }, [searchParams, isLoggedIn, navigate, toast, setSearchParams]);

  // 2. 处理分析逻辑
  const handleStartAnalysis = async () => {
    const subjectId = searchParams.get('subjectId');
    const localId = searchParams.get('localId');
    
    if (!isLoggedIn) {
      toast.info('请先登录以使用 AI 解读');
      navigate('/login?callbackUrl=' + encodeURIComponent(location.pathname + location.search));
      return;
    }
    
    // 如果是本地命盘，需要先同步到后端
    if (localId && !subjectId) {
      toast.info('本地命盘需要先同步到云端才能使用 AI 解读');
      // TODO: 实现同步逻辑
      return;
    }
    
    if (!subjectId) {
      toast.error('无法进行 AI 解读');
      return;
    }
    
    setIsAnalysisLoading(true);
    
    try {
      const res = await api.post('/fortune/analyze', {
        subjectId,
      });
      
      setAnalysisData(res.analysis);
      updateUser({ balance: res.remainingBalance });
      toast.success('AI 解读完成');
    } catch (error) {
      if (error.code === 'INSUFFICIENT_POINTS') {
        toast.error(`积分不足，当前余额: ${error.currentBalance}`);
      } else {
        toast.error(error.message);
      }
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  // 3. 处理命盘切换
  const handleSwitchSubject = (subject) => {
    setAnalysisData(null);
    if (subject.isLocal) {
      setSearchParams({ localId: subject.id });
    } else {
      setSearchParams({ subjectId: subject.id });
    }
  };

  // 4. 处理删除命盘
  const handleDeleteSubject = async (id) => {
    const subject = subjects.find(s => s.id === id);
    
    if (subject?.isLocal) {
      // 删除本地命盘
      deleteLocalSubject(id);
      setSubjects(prev => prev.filter(s => s.id !== id));
      toast.success('删除成功');
    } else {
      // 删除后端命盘
      try {
        await api.delete(`/subjects/${id}`);
        setSubjects(prev => prev.filter(s => s.id !== id));
        toast.success('删除成功');
      } catch (error) {
        toast.error(error.message || '删除失败');
        return;
      }
    }
    
    // 如果删除的是当前命盘，跳转到输入页
    if (currentSubject?.id === id) {
      navigate('/bazi/input');
    }
  };

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

            {/* 右侧：AI 分析卡片 */}
            <motion.div 
              className={styles.rightCol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className={styles.stickyWrapper}>
                <AnalysisCard 
                  data={analysisData} 
                  isLoading={isAnalysisLoading}
                  onStartAnalysis={handleStartAnalysis}
                  isLocalSubject={currentSubject?.isLocal}
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
