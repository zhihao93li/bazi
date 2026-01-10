"use client";

import { motion } from "framer-motion";
import { GlassSelect } from "@/components/ui/glass-select";
import { GlassSwitch } from "@/components/ui/glass-switch";
import LocationSelect from "@/components/LocationSelect";
import { useBaziForm } from "../hooks/useBaziForm";

const YEARS = Array.from({ length: 120 }, (_, i) => ({ value: 1920 + i, label: `${1920 + i}年` })).reverse();
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}月` }));
const DAYS = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}日` }));
const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${i}时` }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ value: i, label: `${i}分` }));

interface UnifiedInputFormProps {
    onCalculate: (data: any) => void;
    subjects?: any[]; // For future subject selection
}

export function UnifiedInputForm({ onCalculate }: UnifiedInputFormProps) {
    const { formState, updateField, validate, error, loading, setLoading } = useBaziForm({
        year: 1995, // Good default
    });

    const handleSubmit = () => {
        if (validate()) {
            onCalculate(formState);
        }
    };

    return (
        <div className="glass-card p-8 md:p-10 max-w-4xl mx-auto relative overflow-hidden">
            {/* Decorative gradient blob inside card */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
                <h2 className="text-2xl font-serif font-bold text-gray-800 mb-8 text-center">
                    输入您的出生信息
                </h2>

                {/* Top Row: Basic Switches */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm text-gray-500 font-medium">性别</span>
                        <GlassSwitch
                            checked={formState.gender === 'female'}
                            onChange={(checked) => updateField('gender', checked ? 'female' : 'male')}
                            options={['男', '女']}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm text-gray-500 font-medium">历法</span>
                        <GlassSwitch
                            checked={formState.calendarType === 'lunar'}
                            onChange={(checked) => updateField('calendarType', checked ? 'lunar' : 'solar')}
                            options={['公历 (阳历)', '农历 (阴历)']}
                        />
                    </div>
                </div>

                {/* Date Selection Row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="z-40">
                        <span className="text-xs text-gray-500 font-medium mb-1 block">年份</span>
                        <GlassSelect
                            value={formState.year}
                            onChange={(v) => updateField('year', Number(v))}
                            options={YEARS}
                            placeholder="年"
                        />
                    </div>
                    <div className="z-40">
                        <span className="text-xs text-gray-500 font-medium mb-1 block">月份</span>
                        <GlassSelect
                            value={formState.month}
                            onChange={(v) => updateField('month', Number(v))}
                            options={MONTHS}
                            placeholder="月"
                        />
                    </div>
                    <div className="z-40">
                        <span className="text-xs text-gray-500 font-medium mb-1 block">日期</span>
                        <GlassSelect
                            value={formState.day}
                            onChange={(v) => updateField('day', Number(v))}
                            options={DAYS}
                            placeholder="日"
                        />
                    </div>
                </div>

                {/* Time Selection Row */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="z-30">
                        <span className="text-xs text-gray-500 font-medium mb-1 block">出生时辰 (24小时制)</span>
                        <GlassSelect
                            value={formState.hour}
                            onChange={(v) => updateField('hour', Number(v))}
                            options={HOURS}
                            placeholder="时"
                        />
                    </div>
                    <div className="z-30">
                        <span className="text-xs text-gray-500 font-medium mb-1 block">分钟 (可选)</span>
                        <GlassSelect
                            value={formState.minute}
                            onChange={(v) => updateField('minute', Number(v))}
                            options={MINUTES}
                            placeholder="分"
                        />
                    </div>
                </div>

                {/* Location Selection */}
                <div className="mb-8 z-20 relative">
                    <LocationSelect
                        value={formState.location}
                        onChange={(loc) => updateField('location', loc)}
                        error={!!error && !formState.location}
                    />
                    <p className="text-xs text-gray-400 mt-2">
                        * 即使不确定准确时间，也请填写大致出生地点，将用于真太阳时校正。
                    </p>
                </div>

                {/* Leap Month (Conditional) */}
                {formState.calendarType === 'lunar' && (
                    <div className="mb-8 flex items-center justify-center">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                            <input
                                type="checkbox"
                                checked={formState.isLeapMonth}
                                onChange={(e) => updateField('isLeapMonth', e.target.checked)}
                                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-400"
                            />
                            <span>是否为闰月</span>
                        </label>
                    </div>
                )}

                {/* Action Button */}
                <div className="mt-8">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full btn-primary py-4 text-lg shadow-xl shadow-purple-200"
                    >
                        {loading ? "正在推算..." : "排布命盘"}
                    </button>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 text-center text-red-500 text-sm bg-red-50 py-2 rounded-lg"
                        >
                            {error}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
