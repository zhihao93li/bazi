import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// 核心业务组件
import FourPillarsCard from '../components/bazi/FourPillarsCard';
import FiveElementsChart from '../components/bazi/FiveElementsChart';
import BaziInfoCard from '../components/bazi/BaziInfoCard';
import DaYunTimeline from '../components/bazi/DaYunTimeline';
import AnalysisCard from '../components/bazi/AnalysisCard';
import SubjectSwitcher from '../components/bazi/SubjectSwitcher';

// Mock Data
import { mockBaziResult } from '../mock/bazi';
import { mockAnalysis } from '../mock/analysis';
import { mockSubjects } from '../mock/subjects';

import styles from './BaziResultPage.module.css';

export default function BaziResultPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, user } = useAuth();
  const toast = useToast();

  const [currentSubject, setCurrentSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [baziResult, setBaziResult] = useState(mockBaziResult); // 默认使用 mock，实际应根据输入计算

  // 1. 初始化数据
  useEffect(() => {
    // 加载 subjects
    const savedSubjects = JSON.parse(localStorage.getItem('bazi_subjects') || '[]');
    const allSubjects = [...(mockSubjects || []), ...savedSubjects];
    setSubjects(allSubjects);

    // 确定当前 subject
    const subjectId = searchParams.get('subjectId');
    if (subjectId) {
      const found = allSubjects.find(s => s.id === subjectId);
      if (found) setCurrentSubject(found);
    } else {
      // 尝试读取 sessionStorage 中的临时输入 (来自 Input 页面)
      const tempInput = sessionStorage.getItem('current_bazi_input');
      if (tempInput) {
        const inputData = JSON.parse(tempInput);
        // 构造一个临时 subject 对象用于显示
        setCurrentSubject({
          id: 'temp',
          name: '未命名',
          relationship: 'self', // 默认
          ...inputData
        });
      }
    }
  }, [searchParams]);

  // 2. 处理分析逻辑
  const handleStartAnalysis = () => {
    if (!isLoggedIn) {
      toast.info('请先登录以解锁 AI 解读');
      navigate('/login?callbackUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    
    // 检查积分 (Mock)
    if (user && user.balance < 100) { // 假设一次分析 100 积分
       // 这里为了演示流程顺畅，我们暂时不卡积分，或者提示积分不足但仍然演示
       // toast.warning('积分不足，请充值');
       // return;
    }

    setIsAnalysisLoading(true);
    // 模拟 API 调用
    setTimeout(() => {
      setAnalysisData(mockAnalysis);
      setIsAnalysisLoading(false);
      toast.success('AI 解读完成');
    }, 2000);
  };

  // 3. 处理人物切换
  const handleSwitchSubject = (subject) => {
    if (subject.id === 'temp') return; // 临时对象不做处理
    setCurrentSubject(subject);
    setAnalysisData(null); // 切换后清空分析结果
    setSearchParams({ subjectId: subject.id });
    // 在真实应用中，这里应该重新请求后端计算新对象的八字
    toast.info(`已切换至 ${subject.name}`);
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          
          {/* 顶部工具栏 */}
          <div className={styles.topBar}>
            <div className={styles.header}>
              <Link to="/bazi/input" className={styles.backButton} title="重新排盘">
                <ArrowLeft size={20} weight="bold" />
              </Link>
              <h1 className={styles.title}>命盘解读</h1>
            </div>

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

          {/* 核心内容网格 */}
          <div className={styles.contentGrid}>
            
            {/* 左侧：命盘主信息 */}
            <motion.div 
              className={styles.leftCol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* 四柱卡片 */}
              <FourPillarsCard data={baziResult.fourPillars} />
              
              {/* 五行分布 */}
              <FiveElementsChart data={baziResult.fiveElements} />
              
              {/* 大运时间轴 */}
              <DaYunTimeline data={baziResult.daYun} />
              
              {/* AI 分析卡片 */}
              <AnalysisCard 
                data={analysisData} 
                isLoading={isAnalysisLoading}
                onStartAnalysis={handleStartAnalysis}
              />
            </motion.div>

            {/* 右侧：辅助信息 (PC端粘性定位) */}
            <motion.div 
              className={styles.rightCol}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className={styles.stickyWrapper}>
                {/* 基础信息卡片 */}
                <BaziInfoCard data={baziResult} />
                
                {/* 这里未来可以加更多小组件，如：每日运势、注意事项等 */}
              </div>
            </motion.div>
            
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
