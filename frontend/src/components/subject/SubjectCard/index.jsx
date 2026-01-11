import { PencilSimple, Trash } from '@phosphor-icons/react';
import Card from '../../common/Card';
import styles from './SubjectCard.module.css';

export default function SubjectCard({
  subject,
  onEdit,
  onDelete,
  className = ''
}) {
  const { name, relationship, gender, birthYear, birthMonth, birthDay, birthHour } = subject;

  const relationshipLabel = {
    self: '本人',
    family: '家人',
    friend: '朋友',
    other: '其他'
  }[relationship] || '其他';

  const genderLabel = gender === 'male' ? '男' : '女';
  
  // Format birth info simply
  const birthText = `${birthYear}年${birthMonth}月${birthDay}日 ${birthHour}时`;

  return (
    <Card 
      className={`${styles.card} ${className}`} 
      hover
    >
      <div className={styles.cardContent}>
        <div className={styles.info}>
          <div className={styles.header}>
            <span className={styles.name}>{name}</span>
            <span className={`${styles.tag} ${relationship === 'self' ? styles.selfTag : ''}`}>
              {relationshipLabel}
            </span>
            <span className={styles.tag}>{genderLabel}</span>
          </div>
          <div className={styles.meta}>
            {birthText}
          </div>
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.actionButton}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(subject);
            }}
            title="编辑"
          >
            <PencilSimple size={20} />
          </button>
          {relationship !== 'self' && (
            <button 
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(subject);
              }}
              title="删除"
            >
              <Trash size={20} />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
