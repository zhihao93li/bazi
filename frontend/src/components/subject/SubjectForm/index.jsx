import { useState, useEffect } from 'react';
import FormInput from '../../common/FormInput';
import BirthInfoForm from '../../bazi/BirthInfoForm';
import styles from './SubjectForm.module.css';

const INITIAL_STATE = {
  name: '',
  relationship: 'other', // Default value, hidden from UI
  gender: 'female',
  calendarType: 'solar',
  birthYear: 1990,
  birthMonth: 1,
  birthDay: 1,
  birthHour: 12,
  birthMinute: 0,
  location: { province: '', city: '' },
  isLeapMonth: false
};

export default function SubjectForm({
  initialValues,
  onSubmit,
  onCancel
}) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialValues) {
      setFormData({
        ...INITIAL_STATE,
        ...initialValues,
        location: initialValues.location || { province: '', city: '' }
      });
    }
  }, [initialValues]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = '请输入称呼';
    if (formData.name.length > 10) newErrors.name = '称呼不能超过10个字';
    if (!formData.birthYear) newErrors.birthYear = '请选择年份';
    // Add more validation as needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <div className={styles.basicInfo}>
        <FormInput
          label="称呼"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder="请输入称呼"
          maxLength={10}
          required
          className={styles.nameInput}
        />
      </div>

      <BirthInfoForm
        value={formData}
        onChange={setFormData}
        errors={errors}
      />

      <button type="submit" className={styles.submitButton}>
        保存
      </button>
    </form>
  );
}
