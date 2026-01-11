import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast, Card } from '../components/common';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BirthInfoForm from '../components/bazi/BirthInfoForm';
import { mockSubjects } from '../mock/subjects';
import styles from './BaziInputPage.module.css';

const INITIAL_FORM = {
  gender: 'male',
  calendarType: 'solar',
  birthYear: 1990,
  birthMonth: 1,
  birthDay: 1,
  birthHour: 12,
  birthMinute: 0,
  location: { province: '', city: '' },
  isLeapMonth: false
};

export default function BaziInputPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn } = useAuth();
  const toast = useToast();
  
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // 检查 URL 参数是否有 subjectId
  useEffect(() => {
    const subjectId = searchParams.get('subjectId');
    if (subjectId) {
      // 尝试从 mock 数据或 localStorage 获取对象信息
      const savedSubjects = JSON.parse(localStorage.getItem('bazi_subjects') || '[]');
      // 合并 mock 数据和本地存储数据
      const allSubjects = [...(mockSubjects || []), ...savedSubjects];
      const subject = allSubjects.find(s => s.id === subjectId);
      
      if (subject) {
        setFormData(prev => ({
          ...prev,
          ...subject, // 覆盖表单数据
          // 确保 location 对象结构正确
          location: subject.location || { province: '', city: '' }
        }));
        toast.info(`已加载 ${subject.name} 的信息`);
      }
    }
  }, [searchParams, toast]);

  const validate = () => {
    const newErrors = {};
    if (!formData.birthYear) newErrors.birthYear = '请选择年份';
    if (!formData.location?.province) newErrors.province = '请选择省份';
    if (!formData.location?.city) newErrors.city = '请选择城市';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    // 模拟排盘计算延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 保存当前表单数据到 sessionStorage，以便结果页使用（模拟后端传参）
    sessionStorage.setItem('current_bazi_input', JSON.stringify(formData));
    
    setIsSubmitting(false);
    
    // 跳转到结果页
    // 如果有 subjectId，也带过去
    const subjectId = searchParams.get('subjectId');
    const queryString = subjectId ? `?subjectId=${subjectId}` : '';
    navigate(`/bazi${queryString}`);
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.header}>
              <h1 className={styles.title}>八字排盘</h1>
              <p className={styles.subtitle}>输入出生信息，开启命理解读</p>
            </div>

            <Card padding="large" className={styles.inputCard}>
              <BirthInfoForm 
                value={formData}
                onChange={setFormData}
                errors={errors}
              />
              
              <Button 
                size="large" 
                className={styles.submitButton}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? '排盘计算中...' : '立即排盘'}
              </Button>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
