import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast, Card } from '../components/common';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientBackground from '../components/GradientBackground';
import BirthInfoForm from '../components/bazi/BirthInfoForm';
import FormInput from '../components/common/FormInput';
import { calculateBazi } from '../utils/bazi/calculator';
import styles from './BaziInputPage.module.css';

const LOCAL_SUBJECTS_KEY = 'bazi_local_subjects';

const INITIAL_FORM = {
  name: '',
  gender: 'female',
  calendarType: 'solar',
  birthYear: 1990,
  birthMonth: 1,
  birthDay: 1,
  birthHour: 12,
  birthMinute: 0,
  location: { province: '', city: '', district: '' },
  isLeapMonth: false
};

// 生成本地 ID
const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 获取本地保存的命盘
export const getLocalSubjects = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SUBJECTS_KEY) || '[]');
  } catch {
    return [];
  }
};

// 保存命盘到本地
const saveLocalSubject = (subject) => {
  const subjects = getLocalSubjects();
  // 检查是否已存在同名
  const existingIndex = subjects.findIndex(s => s.name === subject.name);
  if (existingIndex >= 0) {
    subjects[existingIndex] = subject; // 更新
  } else {
    subjects.push(subject); // 新增
  }
  localStorage.setItem(LOCAL_SUBJECTS_KEY, JSON.stringify(subjects));
  return subject;
};

// 删除本地命盘
export const deleteLocalSubject = (id) => {
  const subjects = getLocalSubjects().filter(s => s.id !== id);
  localStorage.setItem(LOCAL_SUBJECTS_KEY, JSON.stringify(subjects));
};

export default function BaziInputPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // 检查 URL 参数是否有 subjectId
  useEffect(() => {
    const subjectId = searchParams.get('subjectId');
    if (subjectId) {
      // 尝试从本地获取对象信息
      const localSubjects = getLocalSubjects();
      const subject = localSubjects.find(s => s.id === subjectId);
      
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
      // 1. 前端计算八字
      const birthData = {
        gender: formData.gender,
        calendarType: formData.calendarType,
        year: formData.birthYear,
        month: formData.birthMonth,
        day: formData.birthDay,
        hour: formData.birthHour,
        minute: formData.birthMinute,
        isLeapMonth: formData.isLeapMonth,
        location: formData.location.district || formData.location.city,
      };
      
      const baziData = calculateBazi(birthData);
      
      // 2. 统一保存到本地，立即跳转（后台异步同步到云端）
      // 这样可以避免等待网络请求，提升用户体验
      const localSubject = {
        id: generateLocalId(),
        name: formData.name,
        gender: formData.gender,
        calendarType: formData.calendarType,
        birthYear: formData.birthYear,
        birthMonth: formData.birthMonth,
        birthDay: formData.birthDay,
        birthHour: formData.birthHour,
        birthMinute: formData.birthMinute,
        isLeapMonth: formData.isLeapMonth,
        location: `${formData.location.province}/${formData.location.city}/${formData.location.district}`,
        baziData,
        isLocal: true,
        createdAt: new Date().toISOString(),
      };
      
      saveLocalSubject(localSubject);
      
      // 立即跳转到结果页（如果已登录，结果页会自动同步到云端）
      navigate(`/bazi?localId=${localSubject.id}`);
    } catch (error) {
      console.error(error);
      toast.error('排盘计算失败，请检查输入');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
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
