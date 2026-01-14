import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { ClockCounterClockwise, Trash, CaretRight, User, MagnifyingGlass } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useToast, LoadingSpinner, LoadingOverlay } from '../components/common'; // Import
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientBackground from '../components/GradientBackground';
import { api } from '../services/api';
import styles from './HistoryPage.module.css';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Check Login
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/login?callbackUrl=/history', { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate]);

  // 2. Load Data
  useEffect(() => {
    if (isLoggedIn) {
      loadRecords();
    }
  }, [isLoggedIn]);

  const loadRecords = async () => {
    try {
      const res = await api.get('/reports?page=1&limit=50');
      setRecords(res.reports);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await api.delete(`/reports/${id}`);
        setRecords(prev => prev.filter(r => r.id !== id));
        toast.success('记录已删除');
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };

  const filteredRecords = records.filter(r =>
    (r.subjectName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) {
    return <LoadingOverlay fixed />;
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Background - Memory/Cool for History - Strengthened */}
        <GradientBackground
          gridCount={0}
          glowColors={['rgba(94, 106, 210, 0.5)', 'rgba(138, 67, 225, 0.4)']}
          noiseOpacity={0.15}
          animated
          expanded
        />

        <div className={styles.container}>

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.titleGroup}>
              <h1 className={styles.title}>历史记录</h1>
              <p className={styles.subtitle}>查看您的测算历史与分析报告</p>
            </div>

            <div className={styles.filterGroup}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="搜索称呼..."
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
            {isLoading ? (
              <div className={styles.emptyState}>
                <LoadingSpinner size="large" color="purple" />
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className={styles.emptyState}>
                <ClockCounterClockwise size={48} className={styles.emptyIcon} />
                <p>暂无历史记录</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredRecords.map((record) => (
                  <m.div
                    key={record.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Link to Bazi Result Page with subjectId or reportId */}
                    <Link to={`/bazi?subjectId=${record.subjectId}&reportId=${record.id}`} className={styles.recordCard}>
                      <div className={styles.cardLeft}>
                        <div className={`${styles.avatar} ${record.subjectRel === 'self' ? styles.self : ''}`}>
                          <User weight="fill" />
                        </div>
                        <div className={styles.info}>
                          <div className={styles.nameRow}>
                            <span className={styles.name}>{record.subjectName || '未知对象'}</span>
                            {record.analysis && <span className={`${styles.tag} ${styles.analyzed}`}>已分析</span>}
                          </div>
                          <div className={styles.dateInfo}>
                            <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                            <div className={styles.divider} />
                            <span>消耗 {record.pointsCost} 积分</span>
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
                  </m.div>
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
