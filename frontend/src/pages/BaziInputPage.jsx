import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast, Card } from '../components/common';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientBackground from '../components/GradientBackground';
import BirthInfoForm from '../components/bazi/BirthInfoForm';
import FormInput from '../components/common/FormInput'; // Import FormInput
import { calculateBazi } from '../utils/bazi/calculator'; // Import Calculator
import { mockSubjects } from '../mock/subjects';
import styles from './BaziInputPage.module.css';

const INITIAL_FORM = {
  name: '', // Added name
  gender: 'female',
  calendarType: 'solar',
  birthYear: 1990,
  birthMonth: 1,
  birthDay: 1,
  birthHour: 12,
  birthMinute: 0,
  location: { province: '', city: '', district: '' }, // 3 levels
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
      const allSubjects = [...(mockSubjects || []), ...savedSubjects];
      const subject = allSubjects.find(s => s.id === subjectId);
      
      if (subject) {
        setFormData(prev => ({
          ...prev,
          ...subject,
          location: subject.location || { province: '', city: '', district: '' }
        }));
        toast.info(`已加载 ${subject.name} 的信息`);
      }
    }
  }, [searchParams, toast]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = '请输入称呼';
    if (formData.name.length > 10) newErrors.name = '称呼不能超过10个字';
    if (!formData.birthYear) newErrors.birthYear = '请选择年份';
    if (!formData.location?.province) newErrors.province = '请选择省份';
    if (!formData.location?.city) newErrors.city = '请选择城市';
    if (!formData.location?.district) newErrors.district = '请选择区县';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      // 1. 前端计算八字 (无需登录)
      const birthData = {
        gender: formData.gender,
        calendarType: formData.calendarType,
        year: formData.birthYear,
        month: formData.birthMonth,
        day: formData.birthDay,
        hour: formData.birthHour,
        minute: formData.birthMinute,
        isLeapMonth: formData.isLeapMonth,
        location: formData.location.district || formData.location.city, // Use most specific
      };
      
      const baziData = calculateBazi(birthData);
      
      // 2. 存入 sessionStorage，跳转结果页 (不创建对象)
      sessionStorage.setItem('current_bazi_input', JSON.stringify(formData));
      sessionStorage.setItem('current_bazi_result', JSON.stringify(baziData));
      
      // 模拟一点延迟提升体验
      await new Promise(resolve => setTimeout(resolve, 500));
      
      navigate('/bazi'); 
    } catch (error) {
      console.error(error);
      toast.error('排盘计算失败，请检查输入');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Background - Purple/Gold for Input Anticipation - Strengthened */}
        <GradientBackground 
          gridCount={0} 
          glowColors={['rgba(138, 67, 225, 0.5)', 'rgba(239, 123, 22, 0.4)']} 
          noiseOpacity={0.15}
          animated
          expanded
        />

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
              <div style={{ marginBottom: '24px' }}>
                <FormInput
                  label="称呼"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  placeholder="请输入称呼"
                  maxLength={10}
                  required
                />
              </div>

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
