import { useEffect, useMemo } from 'react';
import FormInput from '../../common/FormInput';
import FormSelect from '../../common/FormSelect';
import ButtonGroup from '../../common/ButtonGroup';
import Checkbox from '../../common/Checkbox';
import { PROVINCES, CALENDAR_OPTIONS } from '../../../utils/constants';
import styles from './BirthInfoForm.module.css';

export default function BirthInfoForm({
  value,
  onChange,
  errors = {},
  className = ''
}) {
  // Generate options
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const result = [];
    for (let i = currentYear; i >= 1900; i--) {
      result.push({ value: i, label: `${i}年` });
    }
    return result;
  }, []);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}月`
    }));
  }, []);

  const days = useMemo(() => {
    // Simple 31 days for now
    return Array.from({ length: 31 }, (_, i) => ({
      value: i + 1,
      label: `${i + 1}日`
    }));
  }, []);

  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      value: i,
      label: `${i}时`
    }));
  }, []);

  const minutes = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      value: i,
      label: `${i}分`
    }));
  }, []);

  // Handle nested changes
  const handleChange = (field, newVal) => {
    onChange({
      ...value,
      [field]: newVal
    });
  };

  // Province change -> reset city & district
  const handleProvinceChange = (e) => {
    const newProvince = e.target.value;
    onChange({
      ...value,
      location: {
        province: newProvince,
        city: '',
        district: ''
      }
    });
  };

  // City change -> reset district
  const handleCityChange = (e) => {
    const newCity = e.target.value;
    onChange({
      ...value,
      location: {
        ...value.location,
        city: newCity,
        district: ''
      }
    });
  };

  const handleDistrictChange = (e) => {
    onChange({
      ...value,
      location: {
        ...value.location,
        district: e.target.value
      }
    });
  };

  // Get cities for current province
  const currentCities = useMemo(() => {
    const province = PROVINCES.find(p => p.value === value.location?.province);
    return province ? province.cities : [];
  }, [value.location?.province]);

  // Get districts for current city
  const currentDistricts = useMemo(() => {
    const city = currentCities.find(c => c.value === value.location?.city);
    return city ? city.districts : [];
  }, [value.location?.city, currentCities]);

  return (
    <div className={`${styles.formGrid} ${className}`}>
      {/* Gender (display only) & Calendar Type */}
      <div className={styles.row}>
        <div>
          <div className={styles.sectionTitle}>性别</div>
          <div className={styles.genderDisplay}>女</div>
        </div>
        <div>
          <div className={styles.sectionTitle}>历法</div>
          <ButtonGroup
            options={CALENDAR_OPTIONS}
            value={value.calendarType}
            name="calendarType"
            onChange={(e) => handleChange('calendarType', e.target.value)}
            fullWidth
          />
        </div>
      </div>

      {/* Date Selection */}
      <div>
        <div className={styles.sectionTitle}>出生日期</div>
        <div className={styles.dateRow}>
          <FormSelect
            placeholder="年"
            options={years}
            value={value.birthYear}
            name="birthYear"
            onChange={(e) => handleChange('birthYear', e.target.value)}
            error={errors.birthYear}
          />
          <FormSelect
            placeholder="月"
            options={months}
            value={value.birthMonth}
            name="birthMonth"
            onChange={(e) => handleChange('birthMonth', e.target.value)}
            error={errors.birthMonth}
          />
          <FormSelect
            placeholder="日"
            options={days}
            value={value.birthDay}
            name="birthDay"
            onChange={(e) => handleChange('birthDay', e.target.value)}
            error={errors.birthDay}
          />

          {/* Lunar Leap Month Checkbox - Inside flex row */}
          {value.calendarType === 'lunar' && (
            <div className={styles.checkboxWrapper}>
              <Checkbox
                label="闰月"
                checked={value.isLeapMonth}
                onChange={(e) => handleChange('isLeapMonth', e.target.checked)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Time Selection */}
      <div>
        <div className={styles.sectionTitle}>出生时间</div>
        <div className={styles.timeRow}>
          <FormSelect
            placeholder="时"
            options={hours}
            value={value.birthHour}
            name="birthHour"
            onChange={(e) => handleChange('birthHour', e.target.value)}
            error={errors.birthHour}
          />
          <FormSelect
            placeholder="分"
            options={minutes}
            value={value.birthMinute}
            name="birthMinute"
            onChange={(e) => handleChange('birthMinute', e.target.value)}
            error={errors.birthMinute}
          />
        </div>
      </div>

      {/* Location Selection - 3 Levels */}
      <div>
        <div className={styles.sectionTitle}>出生地点 (省/市/区)</div>
        <div className={styles.locationRow}>
          <FormSelect
            placeholder="省份"
            options={PROVINCES}
            value={value.location?.province}
            name="province"
            onChange={handleProvinceChange}
            error={errors.province}
          />
          <FormSelect
            placeholder="城市"
            options={currentCities}
            value={value.location?.city}
            name="city"
            onChange={handleCityChange}
            disabled={!value.location?.province}
            error={errors.city}
          />
          <FormSelect
            placeholder="区县"
            options={currentDistricts}
            value={value.location?.district}
            name="district"
            onChange={handleDistrictChange}
            disabled={!value.location?.city}
            error={errors.district}
          />
        </div>
      </div>
    </div>
  );
}
