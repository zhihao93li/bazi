import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useToast, Card } from '../components/common';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientBackground from '../components/GradientBackground';
import BirthInfoForm from '../components/bazi/BirthInfoForm';
import FormInput from '../components/common/FormInput';
import {
  generateLocalId,
  getLocalSubjects,
  saveLocalSubject
} from '../utils/localSubjects';
import { useAuth } from '../context/AuthContext';
import { useSubjects, SUBJECTS_QUERY_KEY } from '../hooks';
import { api } from '../services/api';
import styles from './BaziInputPage.module.css';

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

export default function BaziInputPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // 获取已有的命盘列表（用于检查名称重复）
  const { data: cloudSubjects = [] } = useSubjects(isLoggedIn);

  // 合并云端和本地命盘的名称列表
  const existingNames = useMemo(() => {
    const localSubjects = getLocalSubjects();
    const allSubjects = [...cloudSubjects, ...localSubjects];
    return allSubjects.map(s => s.name?.trim()).filter(Boolean);
  }, [cloudSubjects]);

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
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      newErrors.name = '请输入称呼';
    } else if (trimmedName.length > 10) {
      newErrors.name = '称呼不能超过10个字';
    } else if (existingNames.includes(trimmedName)) {
      newErrors.name = '该称呼已存在，请使用其他名称';
    }

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
      // 处理月份：负数表示闰月
      const isLeap = formData.birthMonth < 0;
      const actualMonth = Math.abs(formData.birthMonth);

      // 调用后端 API 计算八字
      const birthData = {
        gender: formData.gender,
        calendarType: formData.calendarType,
        year: formData.birthYear,
        month: actualMonth,
        day: formData.birthDay,
        hour: formData.birthHour,
        minute: formData.birthMinute,
        isLeapMonth: isLeap,
        location: `${formData.location.province}/${formData.location.city}/${formData.location.district}`,
      };

      const result = await api.post('/bazi/calculate', birthData);

      if (!result.success) {
        throw new Error(result.message || '排盘计算失败');
      }

      const baziData = result.baziData;

      const subjectData = {
        name: formData.name.trim(),
        gender: formData.gender,
        calendarType: formData.calendarType,
        birthYear: formData.birthYear,
        birthMonth: actualMonth,
        birthDay: formData.birthDay,
        birthHour: formData.birthHour,
        birthMinute: formData.birthMinute,
        isLeapMonth: isLeap,
        location: `${formData.location.province}/${formData.location.city}/${formData.location.district}`,
        baziData,
      };

      if (isLoggedIn) {
        // 已登录：直接调用后端 API 创建命盘，等待完成后跳转
        const res = await api.post('/subjects', subjectData);

        // 使命盘列表缓存失效，确保其他页面能获取最新数据
        queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });

        // 跳转到结果页（使用后端返回的真实 subjectId）
        navigate(`/bazi?subjectId=${res.subject.id}`);
      } else {
        // 未登录：保存到本地，后续登录时再同步
        const localSubject = {
          id: generateLocalId(),
          ...subjectData,
          isLocal: true,
          createdAt: new Date().toISOString(),
        };

        saveLocalSubject(localSubject);

        // 使命盘列表缓存失效，确保其他页面能获取最新数据
        queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });

        // 跳转到结果页
        navigate(`/bazi?localId=${localSubject.id}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || '排盘计算失败，请检查输入');
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
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.header}>
              <h1 className={styles.title}>八字排盘</h1>
              <p className={styles.subtitle}>输入出生信息，开启人生解读</p>
            </div>

            <Card padding="large" className={styles.inputCard}>
              <div style={{ marginBottom: '24px' }}>
                <FormInput
                  label="称呼"
                  name="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    // 清除名称错误，等待提交时重新验证
                    if (errors.name) {
                      setErrors(prev => ({ ...prev, name: undefined }));
                    }
                  }}
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
          </m.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
