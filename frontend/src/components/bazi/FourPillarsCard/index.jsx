import Card from '../../common/Card';
import { ELEMENT_COLORS } from '../../../mock/bazi';
import styles from './FourPillarsCard.module.css';

const Pillar = ({ title, stem, branch, stemElement, branchElement, tenGods }) => {
  return (
    <div className={styles.pillar}>
      <span className={styles.pillarTitle}>{title}</span>
      <div 
        className={styles.charBox}
        style={{ color: ELEMENT_COLORS[stemElement] }}
      >
        {stem}
      </div>
      <div 
        className={styles.charBox}
        style={{ color: ELEMENT_COLORS[branchElement] }}
      >
        {branch}
      </div>
      <span className={styles.tenGods}>{tenGods || '-'}</span>
    </div>
  );
};

export default function FourPillarsCard({ data, className = '' }) {
  if (!data) return null;

  return (
    <Card className={`${styles.card} ${className}`}>
      <div className={styles.header}>八字命盘</div>
      <div className={styles.pillarsGrid}>
        <Pillar 
          title="年柱"
          stem={data.year.heavenlyStem}
          branch={data.year.earthlyBranch}
          stemElement={data.year.heavenlyStemElement}
          branchElement={data.year.earthlyBranchElement}
          tenGods={data.year.tenGods}
        />
        <Pillar 
          title="月柱"
          stem={data.month.heavenlyStem}
          branch={data.month.earthlyBranch}
          stemElement={data.month.heavenlyStemElement}
          branchElement={data.month.earthlyBranchElement}
          tenGods={data.month.tenGods}
        />
        <Pillar 
          title="日柱"
          stem={data.day.heavenlyStem}
          branch={data.day.earthlyBranch}
          stemElement={data.day.heavenlyStemElement}
          branchElement={data.day.earthlyBranchElement}
          tenGods={data.day.tenGods}
        />
        <Pillar 
          title="时柱"
          stem={data.hour.heavenlyStem}
          branch={data.hour.earthlyBranch}
          stemElement={data.hour.heavenlyStemElement}
          branchElement={data.hour.earthlyBranchElement}
          tenGods={data.hour.tenGods}
        />
      </div>
    </Card>
  );
}
