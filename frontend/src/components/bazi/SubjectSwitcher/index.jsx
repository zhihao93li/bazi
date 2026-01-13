import { useState } from 'react';
import { Plus, X } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../common';
import styles from './SubjectSwitcher.module.css';

/**
 * SubjectSwitcher - 测算对象切换器（平铺胶囊按钮）
 */
export default function SubjectSwitcher({
  currentSubject,
  subjects = [],
  onSelect,
  onDelete,
  className = ''
}) {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleAddNew = () => {
    navigate('/bazi/input');
  };

  const handleDeleteClick = (e, subject) => {
    e.stopPropagation();
    setDeleteTarget(subject);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget && onDelete) {
      onDelete(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div className={`${styles.switcher} ${className}`}>
      {/* 对象胶囊按钮列表 */}
      <div className={styles.pillList}>
        {subjects.map((sub) => (
          <div key={sub.id} className={styles.pillWrapper}>
            <button
              className={`${styles.pill} ${currentSubject?.id === sub.id ? styles.active : ''}`}
              onClick={() => onSelect(sub)}
            >
              <span className={styles.pillName}>{sub.name}</span>
            </button>
            {/* 删除按钮 */}
            <button
              className={styles.deleteBtn}
              onClick={(e) => handleDeleteClick(e, sub)}
              title="删除此命盘"
            >
              <X size={10} weight="bold" />
            </button>
          </div>
        ))}
        
        {/* 添加新对象按钮 */}
        <button className={styles.addPill} onClick={handleAddNew}>
          <Plus size={16} weight="bold" />
          <span>新增</span>
        </button>
      </div>

      {/* 删除确认弹窗 */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="确认删除"
      >
        <div className={styles.modalContent}>
          <p>确定要删除「{deleteTarget?.name}」的命盘数据吗？</p>
          <p className={styles.modalWarning}>此操作不可恢复</p>
          <div className={styles.modalActions}>
            <button 
              className={styles.cancelBtn}
              onClick={() => setDeleteTarget(null)}
            >
              取消
            </button>
            <button 
              className={styles.confirmBtn}
              onClick={handleConfirmDelete}
            >
              确认删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
