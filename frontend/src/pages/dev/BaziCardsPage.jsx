import { useState } from 'react';
import FourPillarsCard from '../../components/bazi/FourPillarsCard';
import FiveElementsChart from '../../components/bazi/FiveElementsChart';
import BaziInfoCard from '../../components/bazi/BaziInfoCard';
import DaYunTimeline from '../../components/bazi/DaYunTimeline';
import AnalysisCard from '../../components/bazi/AnalysisCard';
import { mockBaziResult } from '../../mock/bazi';
import { mockAnalysis } from '../../mock/analysis';
import styles from './BaziCardsPage.module.css';

export default function BaziCardsPage() {
  const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartAnalysis = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAnalysisData(mockAnalysis);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>命盘与 AI 解读</h1>
      
      {/* 命盘区域 */}
      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <FourPillarsCard data={mockBaziResult.fourPillars} />
          <FiveElementsChart data={mockBaziResult.fiveElements} />
        </div>
        
        <div className={styles.rightCol}>
          <BaziInfoCard data={mockBaziResult} />
        </div>
      </div>

      <div className={styles.section}>
        <h3>大运时间轴</h3>
        <DaYunTimeline data={mockBaziResult.daYun} />
      </div>

      {/* AI 分析区域 - 新增 */}
      <div className={styles.section}>
        <h3>AI 深度解读</h3>
        <AnalysisCard 
          data={analysisData}
          isLoading={isLoading}
          onStartAnalysis={handleStartAnalysis}
        />
      </div>

      <div className={styles.debug}>
        <h3>Mock Data Source:</h3>
        <pre>{JSON.stringify(mockBaziResult, null, 2)}</pre>
      </div>
    </div>
  );
}
