import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FloppyDisk } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useToast, LoadingOverlay } from '../components/common';
import Button from '../components/Button'; // Import Button
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientBackground from '../components/GradientBackground';
import { api } from '../services/api'; // Import API

// 核心业务组件
import BaziChartCard from '../components/bazi/BaziChartCard';
import AnalysisCard from '../components/bazi/AnalysisCard';
import SubjectSwitcher from '../components/bazi/SubjectSwitcher';

import styles from './BaziResultPage.module.css';

export default function BaziResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, user, updateUser } = useAuth();
  const toast = useToast();

  const [currentSubject, setCurrentSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [baziResult, setBaziResult] = useState(null);
  const [inputData, setInputData] = useState(null); // Raw input for saving

  // 1. 初始化数据
  useEffect(() => {
    const subjectId = searchParams.get('subjectId');

    // Load subjects list if logged in
    if (isLoggedIn) {
      api.get('/subjects').then(res => setSubjects(res.subjects)).catch(() => {});
    }

    if (subjectId) {
      // 已有对象：从后端加载
      api.get(`/subjects/${subjectId}`).then(res => {
        setCurrentSubject(res.subject);
        setBaziResult(res.subject.baziData);
        // Clear temp data
        setInputData(null);
      }).catch(err => {
        toast.error('获取对象失败');
        navigate('/bazi/input');
      });
    } else {
      // 新排盘：从 sessionStorage 读取（未登录/未保存预览）
      const cachedBazi = sessionStorage.getItem('current_bazi_result');
      const cachedInput = sessionStorage.getItem('current_bazi_input');
      
      if (cachedBazi) setBaziResult(JSON.parse(cachedBazi));
      if (cachedInput) {
        const input = JSON.parse(cachedInput);
        setInputData(input);
        // 构造临时对象显示名字
        setCurrentSubject({
          id: 'temp',
          name: input.name,
          relationship: 'self',
          ...input
        });
      }
    }
  }, [searchParams, isLoggedIn]);

  // 保存对象
  const handleSaveSubject = async () => {
    if (!isLoggedIn) {
      toast.info('请先登录');
      navigate('/login?callbackUrl=' + encodeURIComponent(location.pathname + location.search));
      return null;
    }
    
    if (!inputData || !baziResult) return null;
    
    try {
      const res = await api.post('/subjects', {
        name: inputData.name,
        gender: inputData.gender,
        calendarType: inputData.calendarType,
        birthYear: inputData.birthYear,
        birthMonth: inputData.birthMonth,
        birthDay: inputData.birthDay,
        birthHour: inputData.birthHour,
        birthMinute: inputData.birthMinute,
        isLeapMonth: inputData.isLeapMonth,
        location: `${inputData.location.province}/${inputData.location.city}/${inputData.location.district}`,
        baziData: baziResult,
      });
      
      setCurrentSubject(res.subject);
      setSubjects(prev => [...prev, res.subject]);
      // 更新 URL
      setSearchParams({ subjectId: res.subject.id });
      toast.success('保存成功');
      return res.subject;
    } catch (error) {
      if (error.code === 'NAME_DUPLICATE') {
        toast.error('名称已存在，请使用其他名称');
      } else {
        toast.error(error.message);
      }
      return null;
    }
  };

  // 2. 处理分析逻辑
  const handleStartAnalysis = async () => {
    if (!isLoggedIn) {
      toast.info('请先登录以解锁 AI 解读');
      navigate('/login?callbackUrl=' + encodeURIComponent(location.pathname + location.search));
      return;
    }
    
    // 立即显示加载状态
    setIsAnalysisLoading(true);
    
    // 如果还没保存对象 (subjectId absent)，先保存
    let targetSubjectId = searchParams.get('subjectId');
    if (!targetSubjectId) {
      const savedSubject = await handleSaveSubject();
      if (!savedSubject) {
        setIsAnalysisLoading(false); // 保存失败时取消加载状态
        return;
      }
      targetSubjectId = savedSubject.id;
    }
    try {
      const res = await api.post('/fortune/analyze', {
        subjectId: targetSubjectId,
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

  // 3. 处理人物切换
  const handleSwitchSubject = (subject) => {
    if (subject.id === 'temp') return; 
    setAnalysisData(null); 
    setSearchParams({ subjectId: subject.id });
  };

  // Custom Bazi Colors for Gradient (Purple/Blue/Gold)
  const baziGlowColors = [
    'rgba(138, 67, 225, 0.5)',   // Purple
    'rgba(94, 106, 210, 0.5)',   // Blue
    'rgba(239, 123, 22, 0.4)',   // Orange/Gold
  ];

  if (!baziResult) {
    return <LoadingOverlay fixed text="排盘计算中..." />; // Use global loading
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Background Layer */}
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
          
          {/* 顶部工具栏 */}
          <div className={styles.topBar}>
            <div className={styles.header}>
              <Link to="/bazi/input" className={styles.backButton} title="重新排盘">
                <ArrowLeft size={20} weight="bold" />
              </Link>
              <h1 className={styles.title}>命盘解读</h1>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               {/* Show Save button if not saved (temp subject) */}
               {!searchParams.get('subjectId') && (
                 <Button size="small" variant="outline" onClick={handleSaveSubject}>
                   <FloppyDisk size={18} />
                   保存
                 </Button>
               )}

               {/* 人物切换器 (仅登录可见) */}
               {isLoggedIn && (
                 <div className={styles.switcher}>
                   <SubjectSwitcher 
                     currentSubject={currentSubject}
                     subjects={subjects}
                     onSelect={handleSwitchSubject}
                   />
                 </div>
               )}
            </div>
          </div>

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
                isSaved={!!searchParams.get('subjectId')}
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
