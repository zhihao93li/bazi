import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ClockCounterClockwise, Trash, CaretRight, User, MagnifyingGlass } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
// import FormInput from '../components/common/FormInput';
import styles from './HistoryPage.module.css';

// Mock Data Structure
// { id, subjectName, subjectRel, action, createdAt, isAnalyzed }

export default function HistoryPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Check Login
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login?callbackUrl=/history', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // 2. Load Data (Simulated)
  useEffect(() => {
    // Generate some mock history data if empty
    const mockHistory = [
      { id: 'h1', subjectName: '张三', subjectRel: 'self', action: '排盘查看', createdAt: '2023-10-24 14:30', isAnalyzed: true },
      { id: 'h2', subjectName: '李四', subjectRel: 'friend', action: '排盘查看', createdAt: '2023-10-23 09:15', isAnalyzed: false },
      { id: 'h3', subjectName: '王五', subjectRel: 'other', action: '排盘查看', createdAt: '2023-10-20 18:45', isAnalyzed: true },
    ];
    setRecords(mockHistory);
  }, []);

  const handleDelete = (e, id) => {
    e.preventDefault(); // Prevent link navigation
    if (confirm('确定要删除这条记录吗？')) {
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.success('记录已删除');
    }
  };

  const filteredRecords = records.filter(r => 
    r.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.titleGroup}>
              <h1 className={styles.title}>历史记录</h1>
              <p className={styles.subtitle}>查看您的测算历史与分析报告</p>
            </div>
            
            <div className={styles.filterGroup}>
              {/* Simple Search */}
               {/* Note: FormInput might need adjustment for this small usage, using standard input style for now if needed or simple styling */}
               <div style={{ position: 'relative' }}>
                 <input 
                   type="text" 
                   placeholder="搜索姓名..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   style={{
                     padding: '10px 16px 10px 36px',
                     borderRadius: '20px',
                     border: '1px solid var(--light-90)',
                     fontSize: '14px',
                     outline: 'none',
                     width: '200px'
                   }}
                 />
                 <MagnifyingGlass 
                   size={16} 
                   style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--grey-50)' }} 
                 />
               </div>
            </div>
          </div>

          {/* List */}
          <div className={styles.listContainer}>
            {filteredRecords.length === 0 ? (
              <div className={styles.emptyState}>
                <ClockCounterClockwise size={48} className={styles.emptyIcon} />
                <p>暂无历史记录</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredRecords.map((record) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link to={`/bazi?historyId=${record.id}`} className={styles.recordCard}>
                      <div className={styles.cardLeft}>
                        <div className={`${styles.avatar} ${record.subjectRel === 'self' ? styles.self : ''}`}>
                          {record.subjectRel === 'self' ? <User weight="fill" /> : record.subjectName[0]}
                        </div>
                        <div className={styles.info}>
                          <div className={styles.nameRow}>
                            <span className={styles.name}>{record.subjectName}</span>
                            {record.isAnalyzed && <span className={`${styles.tag} ${styles.analyzed}`}>已分析</span>}
                          </div>
                          <div className={styles.dateInfo}>
                            <span>{record.createdAt}</span>
                            <div className={styles.divider} />
                            <span>{record.action}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className={styles.cardRight}>
                        <button 
                          className={styles.deleteButton}
                          onClick={(e) => handleDelete(e, record.id)}
                          title="删除记录"
                        >
                          <Trash size={18} />
                        </button>
                        <CaretRight size={18} className={styles.arrow} />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
