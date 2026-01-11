import { mockBaziResult } from '../mock/bazi';
import { ELEMENT_COLORS } from '../mock/bazi';
import styles from './HeroDashboard.module.css';

export default function HeroDashboard() {
  const { fourPillars, fiveElements } = mockBaziResult;

  return (
    <div className={styles.window}>
      {/* Browser Header */}
      <div className={styles.header}>
        <div className={styles.trafficLights}>
          <div className={`${styles.dot} ${styles.red}`} />
          <div className={`${styles.dot} ${styles.yellow}`} />
          <div className={`${styles.dot} ${styles.green}`} />
        </div>
        <div className={styles.addressBar}>
          bazi.prismo.ai/result
        </div>
      </div>

      {/* App Content Preview */}
      <div className={styles.content}>
        {/* Top Section: Pillars */}
        <div className={styles.section}>
          <div className={styles.pillarsGrid}>
            {['year', 'month', 'day', 'hour'].map((key) => (
              <div key={key} className={styles.pillarCard}>
                <div className={styles.pillarLabel}>
                  {{year: '年柱', month: '月柱', day: '日柱', hour: '时柱'}[key]}
                </div>
                <div className={styles.pillarChar} style={{ color: ELEMENT_COLORS[fourPillars[key].heavenlyStemElement] }}>
                  {fourPillars[key].heavenlyStem}
                </div>
                <div className={styles.pillarChar} style={{ color: ELEMENT_COLORS[fourPillars[key].earthlyBranchElement] }}>
                  {fourPillars[key].earthlyBranch}
                </div>
                <div className={styles.godLabel}>{fourPillars[key].tenGods}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Section: Charts & Timeline */}
        <div className={styles.grid2col}>
          {/* Elements Chart */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>五行能量分布</div>
            <div className={styles.chartBar}>
              {['metal', 'wood', 'water', 'fire', 'earth'].map(el => (
                <div 
                  key={el} 
                  className={styles.chartSegment}
                  style={{ 
                    flex: fiveElements[el],
                    backgroundColor: ELEMENT_COLORS[el]
                  }}
                />
              ))}
            </div>
            <div className={styles.legend}>
              <div className={styles.legendItem}><span className={styles.dot} style={{bg: ELEMENT_COLORS.fire}}/> 火 (35%) - 旺</div>
              <div className={styles.legendItem}><span className={styles.dot} style={{bg: ELEMENT_COLORS.water}}/> 水 (25%) - 相</div>
            </div>
          </div>

          {/* Timeline Mock */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>大运流年</div>
            <div className={styles.timeline}>
              {[1994, 2004, 2014, 2024, 2034].map((year, i) => (
                <div key={year} className={`${styles.timeNode} ${i === 3 ? styles.active : ''}`}>
                  <div className={styles.timeLabel}>{year}</div>
                  <div className={styles.timePoint} />
                </div>
              ))}
              <div className={styles.timelineLine} />
            </div>
          </div>
        </div>

        {/* Bottom Section: AI Analysis */}
        <div className={styles.aiCard}>
          <div className={styles.aiHeader}>
            <span className={styles.sparkle}>✨</span> 
            AI 深度解读
          </div>
          <div className={styles.aiContent}>
            <div className={styles.aiLine} style={{ width: '90%' }} />
            <div className={styles.aiLine} style={{ width: '95%' }} />
            <div className={styles.aiLine} style={{ width: '80%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
