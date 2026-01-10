"use client";

import { useState, useEffect, useMemo } from "react";
import locationData from "china-location/dist/location.json";

interface LocationSelectProps {
  value: string;
  onChange: (location: string) => void;
  error?: boolean;
}

interface Province {
  code: string;
  name: string;
  cities: Record<string, City>;
}

interface City {
  code: string;
  name: string;
  districts: Record<string, string>;
}

export default function LocationSelect({ value, onChange, error }: LocationSelectProps) {
  const [provinceCode, setProvinceCode] = useState<string>("");
  const [cityCode, setCityCode] = useState<string>("");
  const [districtCode, setDistrictCode] = useState<string>("");

  // 省份列表
  const provinces = useMemo(() => {
    return Object.entries(locationData as Record<string, Province>).map(([code, data]) => ({
      code,
      name: data.name,
    }));
  }, []);

  // 当前省份的城市列表
  const cities = useMemo(() => {
    if (!provinceCode) return [];
    const province = (locationData as Record<string, Province>)[provinceCode];
    if (!province?.cities) return [];
    return Object.entries(province.cities).map(([code, data]) => ({
      code,
      name: data.name,
    }));
  }, [provinceCode]);

  // 当前城市的区县列表
  const districts = useMemo(() => {
    if (!provinceCode || !cityCode) return [];
    const province = (locationData as Record<string, Province>)[provinceCode];
    const city = province?.cities?.[cityCode];
    if (!city?.districts) return [];
    return Object.entries(city.districts).map(([code, name]) => ({
      code,
      name,
    }));
  }, [provinceCode, cityCode]);

  // 获取当前选择的名称
  const getLocationString = () => {
    const parts: string[] = [];
    
    if (provinceCode) {
      const province = (locationData as Record<string, Province>)[provinceCode];
      parts.push(province.name);
      
      if (cityCode) {
        const city = province.cities[cityCode];
        // 直辖市的市名和省名相同，不重复显示
        if (city.name !== province.name) {
          parts.push(city.name);
        }
        
        if (districtCode && city.districts[districtCode]) {
          parts.push(city.districts[districtCode]);
        }
      }
    }
    
    return parts.join("");
  };

  // 当选择变化时通知父组件
  useEffect(() => {
    if (provinceCode) {
      const locationStr = getLocationString();
      onChange(locationStr);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceCode, cityCode, districtCode]);

  // 省份变化时重置城市和区县
  const handleProvinceChange = (code: string) => {
    setProvinceCode(code);
    setCityCode("");
    setDistrictCode("");
  };

  // 城市变化时重置区县
  const handleCityChange = (code: string) => {
    setCityCode(code);
    setDistrictCode("");
  };

  const selectClass = `w-full px-4 py-3 bg-white/5 border rounded-xl text-white ${
    error && !value ? 'border-red-500/50' : 'border-white/10'
  }`;

  return (
    <div className="space-y-3">
      {/* 省份选择 */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">省/直辖市 <span className="text-red-400">*</span></label>
        <select
          value={provinceCode}
          onChange={(e) => handleProvinceChange(e.target.value)}
          className={selectClass}
        >
          <option value="" className="bg-gray-900">请选择省份</option>
          {provinces.map((p) => (
            <option key={p.code} value={p.code} className="bg-gray-900">
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* 城市选择 */}
      {provinceCode && cities.length > 0 && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">市</label>
          <select
            value={cityCode}
            onChange={(e) => handleCityChange(e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-gray-900">请选择城市</option>
            {cities.map((c) => (
              <option key={c.code} value={c.code} className="bg-gray-900">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 区县选择 */}
      {cityCode && districts.length > 0 && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">区/县</label>
          <select
            value={districtCode}
            onChange={(e) => setDistrictCode(e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-gray-900">请选择区县（可选）</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code} className="bg-gray-900">
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 显示已选择的地址 */}
      {value && (
        <div className="text-xs text-gray-500 pt-1 border-t border-white/10">
          已选择: {value}
        </div>
      )}
    </div>
  );
}
