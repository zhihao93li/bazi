import { useState } from 'react';
import BirthInfoForm from '../../components/bazi/BirthInfoForm';
import styles from './BirthFormPage.module.css';

export default function BirthFormPage() {
  const [formData, setFormData] = useState({
    gender: 'female',
    calendarType: 'solar',
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    birthHour: 12,
    birthMinute: 0,
    location: { province: '', city: '' },
    isLeapMonth: false
  });

  return (
    <div className={styles.container}>
      <h1>出生信息表单测试</h1>
      <div className={styles.content}>
        <div className={styles.formSection}>
          <BirthInfoForm
            value={formData}
            onChange={setFormData}
          />
        </div>
        <div className={styles.debugSection}>
          <h3>实时数据:</h3>
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
