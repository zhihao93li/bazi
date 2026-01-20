import { useEffect, useMemo, useState } from 'react';
import FormInput from '../../common/FormInput';
import FormSelect from '../../common/FormSelect';
import ButtonGroup from '../../common/ButtonGroup';
import { PROVINCES, CALENDAR_OPTIONS, GENDER_OPTIONS } from '../../../utils/constants';
import { api } from '../../../services/api';
import styles from './BirthInfoForm.module.css';

export default function BirthInfoForm({
  value,
  onChange,
  errors = {},
  className = ''
}) {
  // 存储当前年份的闰月信息（0 表示无闰月，1-12 表示闰几月）
  const [leapMonth, setLeapMonth] = useState(0);
  // 存储当前地点的经纬度
  const [coordinates, setCoordinates] = useState(null);

  // 获取闰月信息
  useEffect(() => {
    if (value.calendarType === 'lunar' && value.birthYear) {
      api.get(`/bazi/leap-month/${value.birthYear}`)
        .then((res) => {
          if (res.success) {
            setLeapMonth(res.leapMonth);
          }
        })
        .catch(() => {
          setLeapMonth(0);
        });
    } else {
      setLeapMonth(0);
    }
  }, [value.calendarType, value.birthYear]);

  // 当闰月信息变化时，检查当前选中的月份是否仍然有效
  useEffect(() => {
    // 如果当前选择了闰月（负数月份），但该年实际没有这个闰月，则重置为正常月份
    if (value.birthMonth < 0 && Math.abs(value.birthMonth) !== leapMonth) {
      onChange({
        ...value,
        birthMonth: Math.abs(value.birthMonth),
        isLeapMonth: false
      });
    }
  }, [leapMonth]);

  // 获取经纬度信息
  useEffect(() => {
    const { province, city, district } = value.location || {};
    // 只有选择了区县才获取经纬度
    if (province && city && district) {
      const location = `${province}/${city}/${district}`;
      api.get(`/bazi/coordinates?location=${encodeURIComponent(location)}`)
        .then((res) => {
          if (res.success) {
            setCoordinates(res.coordinates);
          }
        })
        .catch(() => {
          setCoordinates(null);
        });
    } else {
      setCoordinates(null);
    }
  }, [value.location?.province, value.location?.city, value.location?.district]);

  // Generate options
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const result = [];
    for (let i = currentYear; i >= 1900; i--) {
      result.push({ value: i, label: `${i}年` });
    }
    return result;
  }, []);

  // 动态生成月份选项，农历时包含闰月
  const months = useMemo(() => {
    const result = [];
    for (let i = 1; i <= 12; i++) {
      result.push({ value: i, label: `${i}月` });
      // 在农历模式下，如果这个月有闰月，在该月后面插入闰月选项
      if (value.calendarType === 'lunar' && leapMonth === i) {
        result.push({ value: -i, label: `闰${i}月` });
      }
    }
    return result;
  }, [value.calendarType, leapMonth]);

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

  // 处理月份变化，自动设置 isLeapMonth
  const handleMonthChange = (e) => {
    const monthValue = parseInt(e.target.value, 10);
    onChange({
      ...value,
      birthMonth: monthValue,
      isLeapMonth: monthValue < 0 // 负数表示闰月
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
      {/* Gender & Calendar Type */}
      <div className={styles.row}>
        <div>
          <div className={styles.sectionTitle}>性别</div>
          <ButtonGroup
            options={GENDER_OPTIONS}
            value={value.gender}
            name="gender"
            onChange={(e) => handleChange('gender', e.target.value)}
            fullWidth
          />
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
            onChange={handleMonthChange}
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
        {coordinates && (
          <div className={styles.coordinatesDisplay}>
            经度: {coordinates.lng.toFixed(4)}° | 纬度: {coordinates.lat.toFixed(4)}°
          </div>
        )}
      </div>
    </div>
  );
}
