"use client";

import { useState, useEffect, useMemo } from "react";
import locationData from "china-location/dist/location.json";
import { GlassSelect } from "@/components/ui/glass-select";

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

  // Transform data for GlassSelect
  const provinces = useMemo(() => {
    return Object.entries(locationData as Record<string, Province>).map(([code, data]) => ({
      value: code,
      label: data.name,
    }));
  }, []);

  const cities = useMemo(() => {
    if (!provinceCode) return [];
    const province = (locationData as Record<string, Province>)[provinceCode];
    if (!province?.cities) return [];
    return Object.entries(province.cities).map(([code, data]) => ({
      value: code,
      label: data.name,
    }));
  }, [provinceCode]);

  const districts = useMemo(() => {
    if (!provinceCode || !cityCode) return [];
    const province = (locationData as Record<string, Province>)[provinceCode];
    const city = province?.cities?.[cityCode];
    if (!city?.districts) return [];
    return Object.entries(city.districts).map(([code, name]) => ({
      value: code,
      label: name,
    }));
  }, [provinceCode, cityCode]);

  // Construct location string
  const getLocationString = () => {
    const parts: string[] = [];

    if (provinceCode) {
      const province = (locationData as Record<string, Province>)[provinceCode];
      parts.push(province.name);

      if (cityCode) {
        const city = province.cities[cityCode];
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

  useEffect(() => {
    if (provinceCode) {
      const locationStr = getLocationString();
      onChange(locationStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceCode, cityCode, districtCode]);

  const handleProvinceChange = (code: string | number) => {
    setProvinceCode(String(code));
    setCityCode("");
    setDistrictCode("");
    onChange(""); // Clear full location until re-selected
  };

  const handleCityChange = (code: string | number) => {
    setCityCode(String(code));
    setDistrictCode("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="z-30">
        <label className="block text-xs text-gray-500 mb-1 font-medium">省/直辖市</label>
        <GlassSelect
          value={provinceCode}
          onChange={handleProvinceChange}
          options={provinces}
          placeholder="选择省份"
          className={error && !provinceCode ? "ring-2 ring-red-400 rounded-xl" : ""}
        />
      </div>

      <div className="z-20">
        <label className="block text-xs text-gray-500 mb-1 font-medium">城市</label>
        <GlassSelect
          value={cityCode}
          onChange={handleCityChange}
          options={cities}
          placeholder="选择城市"
        />
      </div>

      <div className="z-10">
        <label className="block text-xs text-gray-500 mb-1 font-medium">区/县</label>
        <GlassSelect
          value={districtCode}
          onChange={(val) => setDistrictCode(String(val))}
          options={districts}
          placeholder="选择区县"
        />
      </div>
    </div>
  );
}
