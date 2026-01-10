"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundBeams } from "@/components/ui/background-beams";
import LocationSelect from "@/components/LocationSelect";
import type { BaziData, BaziBirthData, DaYunInfo, LiuNianInfo } from "@/lib/bazi/types";
import type { SubjectData } from "@/lib/subject/types";
import { FIVE_ELEMENTS_CHINESE } from "@/lib/bazi";

// 五行颜色映射
const ELEMENT_COLORS: Record<string, string> = {
  "metal": "text-yellow-400",
  "wood": "text-green-400",
  "water": "text-blue-400",
  "fire": "text-red-400",
  "earth": "text-amber-600",
};

// 分析模块 Tab
const ANALYSIS_TABS = [
  { id: "personality", label: "性格分析" },
  { id: "career", label: "事业运势" },
  { id: "wealth", label: "财运分析" },
  { id: "relationship", label: "感情运势" },
  { id: "overall", label: "综合建议" },
];

// 流年组件
function LiuNianCard({ liuNian, isExpanded, onToggle }: { 
  liuNian: LiuNianInfo; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const isCurrent = liuNian.year === currentYear;
  
  return (
    <div className={`rounded-lg overflow-hidden ${isCurrent ? 'ring-2 ring-purple-500' : ''}`}>
      <button
        onClick={onToggle}
        className={`w-full px-3 py-2 text-left transition-all ${
          isCurrent ? 'bg-purple-500/20' : 'bg-white/5 hover:bg-white/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">{liuNian.ganZhi}</span>
            <span className="text-xs text-gray-500 ml-2">{liuNian.year}年</span>
            {isCurrent && <span className="text-xs text-purple-400 ml-2">今年</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{liuNian.age}岁</span>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      <AnimatePresence>
        {isExpanded && liuNian.liuYue && liuNian.liuYue.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-white/5 border-t border-white/10">
              <div className="text-xs text-gray-400 mb-2">流月</div>
              <div className="grid grid-cols-4 gap-2">
                {liuNian.liuYue.map((ly, idx) => (
                  <div 
                    key={idx} 
                    className="px-2 py-1 bg-white/5 rounded text-center text-sm"
                  >
                    <div className="font-medium">{ly.ganZhi}</div>
                    <div className="text-xs text-gray-500">{ly.monthInChinese}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 大运组件
function DaYunCard({ daYun, isExpanded, onToggle }: { 
  daYun: DaYunInfo; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const [expandedLiuNian, setExpandedLiuNian] = useState<number | null>(null);
  const currentYear = new Date().getFullYear();
  const isCurrent = daYun.startYear <= currentYear && currentYear <= daYun.endYear;
  
  // 跳过第一个空大运
  if (!daYun.ganZhi) return null;
  
  return (
    <div className={`rounded-xl overflow-hidden ${isCurrent ? 'ring-2 ring-yellow-500' : ''}`}>
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 text-left transition-all ${
          isCurrent ? 'bg-yellow-500/20' : 'bg-white/5 hover:bg-white/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold">{daYun.ganZhi}</span>
            {isCurrent && <span className="text-xs text-yellow-400 ml-2">当前大运</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-400">{daYun.startAge}-{daYun.endAge}岁</div>
              <div className="text-xs text-gray-500">{daYun.startYear}-{daYun.endYear}</div>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      <AnimatePresence>
        {isExpanded && daYun.liuNian && daYun.liuNian.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white/5 border-t border-white/10">
              <div className="text-sm text-gray-400 mb-3">流年（点击展开流月）</div>
              <div className="space-y-2">
                {daYun.liuNian.map((ln, idx) => (
                  <LiuNianCard
                    key={idx}
                    liuNian={ln}
                    isExpanded={expandedLiuNian === idx}
                    onToggle={() => setExpandedLiuNian(expandedLiuNian === idx ? null : idx)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 大运区块组件
function DaYunSection({ yun }: { yun: BaziData['yun'] }) {
  const [expandedDaYun, setExpandedDaYun] = useState<number | null>(null);
  
  if (!yun) return null;
  
  // 找到当前大运并默认展开
  const currentYear = new Date().getFullYear();
  const currentDaYunIndex = yun.daYunList.findIndex(
    dy => dy.ganZhi && dy.startYear <= currentYear && currentYear <= dy.endYear
  );
  
  // 如果没有手动选择，默认展开当前大运
  const effectiveExpanded = expandedDaYun ?? (currentDaYunIndex >= 0 ? currentDaYunIndex : null);
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-4">
        大运 ({yun.forward ? '顺行' : '逆行'})
      </h3>
      <div className="text-sm text-gray-400 mb-4">
        起运：{yun.startYear}年{yun.startMonth}月{yun.startDay}日（{yun.startAge}岁）
      </div>
      <div className="space-y-3">
        {yun.daYunList.map((dy, index) => (
          <DaYunCard
            key={index}
            daYun={dy}
            isExpanded={effectiveExpanded === index}
            onToggle={() => setExpandedDaYun(effectiveExpanded === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}

export default function BaziPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Subject state
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectData | null>(null);
  const [showSubjectSelect, setShowSubjectSelect] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [saveAsSubject, setSaveAsSubject] = useState(false);

  // Form state
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [year, setYear] = useState(1990);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [location, setLocation] = useState('');
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  // Result state
  const [baziData, setBaziData] = useState<BaziData | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, string> | null>(null);
  const [activeTab, setActiveTab] = useState("personality");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  // Fetch subjects
  const fetchSubjects = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();
      if (data.success) {
        setSubjects(data.subjects);
      }
    } catch {
      // ignore
    }
  }, [status]);

  // Load subject from URL params
  useEffect(() => {
    const subjectId = searchParams.get("subjectId");
    if (subjectId && subjects.length > 0) {
      const subject = subjects.find(s => s.id === subjectId);
      if (subject) {
        loadSubjectData(subject);
      }
    }
  }, [searchParams, subjects]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const loadSubjectData = (subject: SubjectData) => {
    setSelectedSubject(subject);
    setSubjectName(subject.name);
    setGender(subject.gender as 'male' | 'female');
    setCalendarType(subject.calendarType as 'solar' | 'lunar');
    setYear(subject.birthYear);
    setMonth(subject.birthMonth);
    setDay(subject.birthDay);
    setHour(subject.birthHour);
    setMinute(subject.birthMinute);
    setIsLeapMonth(subject.isLeapMonth);
    setLocation(subject.location);
    setShowSubjectSelect(false);
  };

  const clearSubject = () => {
    setSelectedSubject(null);
    setSubjectName('');
  };

  // Generate options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Calculate Bazi
  const handleCalculate = async () => {
    if (!location) {
      setError("请选择出生地点");
      return;
    }

    setLoading(true);
    setError("");
    setBaziData(null);
    setAnalysis(null);

    try {
      const birthData: BaziBirthData = {
        gender,
        calendarType,
        year,
        month,
        day,
        hour,
        minute,
        location,
        isLeapMonth: calendarType === 'lunar' ? isLeapMonth : undefined,
      };

      const res = await fetch("/api/bazi/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(birthData),
      });

      const data = await res.json();

      if (res.ok) {
        setBaziData(data.baziData);
      } else {
        setError(data.message || "排盘失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };


  // Generate AI Analysis
  const handleAnalyze = async () => {
    if (!baziData) return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/bazi");
      return;
    }

    setAnalyzing(true);
    setError("");

    try {
      // 如果勾选了保存为测算对象，先创建 subject
      let subjectId = selectedSubject?.id;
      
      if (saveAsSubject && subjectName && !selectedSubject) {
        const subjectRes = await fetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: subjectName,
            gender,
            calendarType,
            birthYear: year,
            birthMonth: month,
            birthDay: day,
            birthHour: hour,
            birthMinute: minute,
            isLeapMonth,
            location,
            relationship: "other",
          }),
        });
        const subjectData = await subjectRes.json();
        if (subjectData.success) {
          subjectId = subjectData.subject.id;
          setSelectedSubject(subjectData.subject);
          fetchSubjects(); // 刷新列表
        }
      }

      const res = await fetch("/api/fortune/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baziData, subjectId }),
      });

      const data = await res.json();

      if (res.ok) {
        setAnalysis(data.analysis);
      } else if (res.status === 402 || data.code === "INSUFFICIENT_POINTS") {
        // 积分不足，引导用户充值
        const goToRecharge = confirm(
          `${data.message}\n\n是否前往充值页面？`
        );
        if (goToRecharge) {
          router.push("/points");
        }
      } else {
        setError(data.message || "分析失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black">
      <BackgroundBeams className="absolute inset-0 opacity-30" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 gradient-text">八字排盘</h1>
            <p className="text-gray-400">输入精确出生信息，获取您的八字命盘</p>
          </div>

          {/* Birth Info Form */}
          <div className="glass rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">出生信息</h2>
              {session && subjects.length > 0 && (
                <button
                  onClick={() => setShowSubjectSelect(!showSubjectSelect)}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  {showSubjectSelect ? "手动输入" : "选择已有对象"}
                </button>
              )}
            </div>

            {/* Subject Selection */}
            {showSubjectSelect && (
              <div className="mb-6 p-4 bg-white/5 rounded-xl">
                <div className="text-sm text-gray-400 mb-3">选择测算对象</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => loadSubjectData(subject)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        selectedSubject?.id === subject.id
                          ? "bg-purple-500/30 border border-purple-500"
                          : "bg-white/5 hover:bg-white/10 border border-transparent"
                      }`}
                    >
                      <div className="font-medium">{subject.name}</div>
                      <div className="text-xs text-gray-500">
                        {subject.birthYear}年{subject.birthMonth}月{subject.birthDay}日
                      </div>
                    </button>
                  ))}
                </div>
                {selectedSubject && (
                  <button
                    onClick={clearSubject}
                    className="mt-3 text-sm text-gray-400 hover:text-white"
                  >
                    清除选择
                  </button>
                )}
              </div>
            )}

            {/* Selected Subject Info */}
            {selectedSubject && !showSubjectSelect && (
              <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-purple-400">当前测算对象：</span>
                  <span className="font-medium ml-2">{selectedSubject.name}</span>
                </div>
                <button
                  onClick={clearSubject}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  清除
                </button>
              </div>
            )}

            {/* Calendar Type Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                日期类型
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCalendarType('solar')}
                  className={`px-6 py-2 rounded-lg transition-all ${
                    calendarType === 'solar'
                      ? "bg-purple-500 text-white"
                      : "bg-white/10 text-gray-400 hover:bg-white/15"
                  }`}
                >
                  公历
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarType('lunar')}
                  className={`px-6 py-2 rounded-lg transition-all ${
                    calendarType === 'lunar'
                      ? "bg-purple-500 text-white"
                      : "bg-white/10 text-gray-400 hover:bg-white/15"
                  }`}
                >
                  农历
                </button>
              </div>
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">年</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  {years.map((y) => (
                    <option key={y} value={y} className="bg-gray-900">{y}年</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">月</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  {months.map((m) => (
                    <option key={m} value={m} className="bg-gray-900">{m}月</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">日</label>
                <select
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  {days.map((d) => (
                    <option key={d} value={d} className="bg-gray-900">{d}日</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leap Month (for lunar calendar) */}
            {calendarType === 'lunar' && (
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={isLeapMonth}
                    onChange={(e) => setIsLeapMonth(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  闰月
                </label>
              </div>
            )}

            {/* Time Selection - Precise */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">时（0-23）</label>
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  {hours.map((h) => (
                    <option key={h} value={h} className="bg-gray-900">
                      {h.toString().padStart(2, '0')}时
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">分（0-59）</label>
                <select
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  {minutes.map((m) => (
                    <option key={m} value={m} className="bg-gray-900">
                      {m.toString().padStart(2, '0')}分
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gender Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">性别</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`px-6 py-2 rounded-lg transition-all ${
                    gender === "male"
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-gray-400 hover:bg-white/15"
                  }`}
                >
                  男
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`px-6 py-2 rounded-lg transition-all ${
                    gender === "female"
                      ? "bg-pink-500 text-white"
                      : "bg-white/10 text-gray-400 hover:bg-white/15"
                  }`}
                >
                  女
                </button>
              </div>
            </div>

            {/* Location Selection - Required */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                出生地点 <span className="text-red-400">*</span>
              </label>
              <LocationSelect
                value={location}
                onChange={setLocation}
                error={!location}
              />
              <p className="text-xs text-gray-500 mt-2">
                出生地点用于真太阳时校正，不同地区与北京时间存在时差，会影响时辰的判定
              </p>
            </div>

            {/* Save as Subject Option (only when not already selected) */}
            {session && !selectedSubject && (
              <div className="mb-6 p-4 bg-white/5 rounded-xl">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={saveAsSubject}
                    onChange={(e) => setSaveAsSubject(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-300">保存为测算对象（方便下次快速测算）</span>
                </label>
                {saveAsSubject && (
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="请输入姓名/昵称"
                    className="mt-3 w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                  />
                )}
              </div>
            )}

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={loading || !location}
              className="w-full btn-primary py-4 rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? "排盘中..." : "开始排盘"}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
            >
              {error}
            </motion.div>
          )}


          {/* Bazi Chart Result */}
          {baziData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-8 mb-8"
            >
              <h2 className="text-xl font-semibold mb-6">八字排盘结果</h2>

              {/* Lunar Date Info */}
              <div className="mb-6 p-4 bg-white/5 rounded-xl">
                <div className="text-sm text-gray-400">
                  农历：{baziData.lunarDate.yearInChinese}年 {baziData.lunarDate.monthInChinese}月 {baziData.lunarDate.dayInChinese}
                  {baziData.lunarDate.isLeapMonth && ' (闰月)'}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  生肖：{baziData.shengXiao} | 胎元：{baziData.taiYuan} | 命宫：{baziData.mingGong}
                </div>
              </div>

              {/* Four Pillars */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: "年柱", pillar: baziData.fourPillars.year },
                  { label: "月柱", pillar: baziData.fourPillars.month },
                  { label: "日柱", pillar: baziData.fourPillars.day },
                  { label: "时柱", pillar: baziData.fourPillars.hour },
                ].map(({ label, pillar }) => (
                  <div key={label} className="text-center">
                    <div className="text-sm text-gray-400 mb-2">{label}</div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className={`text-3xl font-bold mb-1 ${ELEMENT_COLORS[pillar.heavenlyStem.element]}`}>
                        {pillar.heavenlyStem.chinese}
                      </div>
                      <div className={`text-3xl font-bold ${ELEMENT_COLORS[pillar.earthlyBranch.element]}`}>
                        {pillar.earthlyBranch.chinese}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">{pillar.naYin}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        藏干：{pillar.hiddenStems.map(s => s.chinese).join(' ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Day Master */}
              <div className="mb-6 p-4 bg-purple-500/10 rounded-xl">
                <span className="text-gray-400">日主：</span>
                <span className={`text-xl font-bold ml-2 ${ELEMENT_COLORS[baziData.dayMaster.stem.element]}`}>
                  {baziData.dayMaster.stem.chinese}
                </span>
                <span className="text-gray-400 ml-4">
                  ({FIVE_ELEMENTS_CHINESE[baziData.dayMaster.stem.element]}) - {baziData.dayMaster.strength === 'strong' ? '身强' : baziData.dayMaster.strength === 'weak' ? '身弱' : '中和'}
                </span>
              </div>

              {/* Five Elements Distribution */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">五行分布</h3>
                <div className="flex flex-wrap gap-4">
                  {(['metal', 'wood', 'water', 'fire', 'earth'] as const).map((element) => (
                    <div
                      key={element}
                      className={`px-4 py-2 bg-white/5 rounded-lg ${ELEMENT_COLORS[element]}`}
                    >
                      {FIVE_ELEMENTS_CHINESE[element]}: {baziData.fiveElements.distribution[element]}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-400">
                  最强：<span className={ELEMENT_COLORS[baziData.fiveElements.strongest]}>{FIVE_ELEMENTS_CHINESE[baziData.fiveElements.strongest]}</span>
                  {" | "}
                  最弱：<span className={ELEMENT_COLORS[baziData.fiveElements.weakest]}>{FIVE_ELEMENTS_CHINESE[baziData.fiveElements.weakest]}</span>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-green-400">喜用神：{baziData.fiveElements.favorable.map(e => FIVE_ELEMENTS_CHINESE[e]).join('、')}</span>
                  {" | "}
                  <span className="text-red-400">忌神：{baziData.fiveElements.unfavorable.map(e => FIVE_ELEMENTS_CHINESE[e]).join('、')}</span>
                </div>
              </div>

              {/* Ten Gods */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">十神关系</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.values(baziData.tenGods.gods).map((god, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-lg text-center">
                      <div className="font-medium">{god.name}</div>
                      <div className="text-xs text-gray-500">{god.positions.join('、')}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Da Yun (Major Fortune) with Liu Nian and Liu Yue */}
              {baziData.yun && (
                <DaYunSection yun={baziData.yun} />
              )}

              {/* AI Analysis Button */}
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full btn-primary py-4 rounded-xl font-medium disabled:opacity-50"
              >
                {analyzing ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    AI 分析中...
                  </span>
                ) : (
                  "生成 AI 命理分析"
                )}
              </button>
              {!session && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  需要登录后才能使用 AI 分析功能
                </p>
              )}
            </motion.div>
          )}

          {/* AI Analysis Result */}
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-8"
            >
              <h2 className="text-xl font-semibold mb-6">AI 命理分析</h2>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {ANALYSIS_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? "bg-purple-500 text-white"
                        : "bg-white/10 text-gray-400 hover:bg-white/15"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-gray-300">
                  {analysis[activeTab] || "暂无分析内容"}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
