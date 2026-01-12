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
          stem={data.year.heavenlyStem.chinese}
          branch={data.year.earthlyBranch.chinese}
          stemElement={data.year.heavenlyStem.element}
          branchElement={data.year.earthlyBranch.element}
          tenGods={data.year.tenGod}
        />
        <Pillar 
          title="月柱"
          stem={data.month.heavenlyStem.chinese}
          branch={data.month.earthlyBranch.chinese}
          stemElement={data.month.heavenlyStem.element}
          branchElement={data.month.earthlyBranch.element}
          tenGods={data.month.tenGod}
        />
        <Pillar 
          title="日柱"
          stem={data.day.heavenlyStem.chinese}
          branch={data.day.earthlyBranch.chinese}
          stemElement={data.day.heavenlyStem.element}
          branchElement={data.day.earthlyBranch.element}
          tenGods={data.day.tenGod}
        />
        <Pillar 
          title="时柱"
          stem={data.hour.heavenlyStem.chinese}
          branch={data.hour.earthlyBranch.chinese}
          stemElement={data.hour.heavenlyStem.element}
          branchElement={data.hour.earthlyBranch.element}
          tenGods={data.hour.tenGod}
        />
      </div>
    </Card>
  );
}
