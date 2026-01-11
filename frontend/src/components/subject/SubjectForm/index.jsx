import { useState, useEffect } from 'react';
import FormInput from '../../common/FormInput';
import FormSelect from '../../common/FormSelect';
import BirthInfoForm from '../../bazi/BirthInfoForm';
import styles from './SubjectForm.module.css';

const RELATIONSHIP_OPTIONS = [
  { value: 'self', label: '本人' },
  { value: 'family', label: '家人' },
  { value: 'friend', label: '朋友' },
  { value: 'other', label: '其他' }
];

const INITIAL_STATE = {
  name: '',
  relationship: 'other',
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
    if (!formData.name.trim()) newErrors.name = '请输入姓名';
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
          label="姓名"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />
        <FormSelect
          label="关系"
          name="relationship"
          value={formData.relationship}
          options={RELATIONSHIP_OPTIONS}
          onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
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
