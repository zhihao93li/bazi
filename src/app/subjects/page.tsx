"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundBeams } from "@/components/ui/background-beams";
import type { SubjectData, CreateSubjectInput } from "@/lib/subject/types";
import LocationSelect from "@/components/LocationSelect";

const RELATIONSHIP_OPTIONS = [
  { value: "self", label: "本人" },
  { value: "family", label: "家人" },
  { value: "friend", label: "朋友" },
  { value: "other", label: "其他" },
];

export default function SubjectsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formData, setFormData] = useState<CreateSubjectInput>({
    name: "",
    gender: "male",
    calendarType: "solar",
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    birthHour: 12,
    birthMinute: 0,
    isLeapMonth: false,
    location: "",
    relationship: "self",
    note: "",
  });

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();
      if (data.success) {
        setSubjects(data.subjects);
      }
    } catch {
      setError("获取测算对象失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/subjects");
      return;
    }
    if (status === "authenticated") {
      fetchSubjects();
    }
  }, [status, router, fetchSubjects]);

  const resetForm = () => {
    setFormData({
      name: "",
      gender: "male",
      calendarType: "solar",
      birthYear: 1990,
      birthMonth: 1,
      birthDay: 1,
      birthHour: 12,
      birthMinute: 0,
      isLeapMonth: false,
      location: "",
      relationship: "self",
      note: "",
    });
    setEditingSubject(null);
  };

  const handleEdit = (subject: SubjectData) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      gender: subject.gender as "male" | "female",
      calendarType: subject.calendarType as "solar" | "lunar",
      birthYear: subject.birthYear,
      birthMonth: subject.birthMonth,
      birthDay: subject.birthDay,
      birthHour: subject.birthHour,
      birthMinute: subject.birthMinute,
      isLeapMonth: subject.isLeapMonth,
      location: subject.location,
      relationship: subject.relationship || "other",
      note: subject.note || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.location) {
      setError("请填写姓名和出生地点");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = editingSubject
        ? `/api/subjects/${editingSubject.id}`
        : "/api/subjects";
      const method = editingSubject ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setShowForm(false);
        resetForm();
        fetchSubjects();
      } else {
        setError(data.message || "保存失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个测算对象吗？")) return;

    try {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        fetchSubjects();
      } else {
        setError(data.message || "删除失败");
      }
    } catch {
      setError("网络错误");
    }
  };

  const handleAnalyze = (subject: SubjectData) => {
    // 跳转到八字页面，带上 subject 信息
    const params = new URLSearchParams({
      subjectId: subject.id,
      name: subject.name,
    });
    router.push(`/bazi?${params.toString()}`);
  };

  // Generate options
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black">
      <BackgroundBeams className="absolute inset-0 opacity-30" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold gradient-text">测算对象</h1>
              <p className="text-gray-400 mt-2">管理您的测算对象，方便快速测算</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="btn-primary px-6 py-3 rounded-xl"
            >
              + 添加对象
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {/* Subject List */}
          {subjects.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-gray-400 mb-4">还没有测算对象</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary px-6 py-3 rounded-xl"
              >
                创建第一个
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {subjects.map((subject) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass rounded-xl p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{subject.name}</h3>
                        <span className="text-xs px-2 py-1 bg-white/10 rounded">
                          {RELATIONSHIP_OPTIONS.find(r => r.value === subject.relationship)?.label || "其他"}
                        </span>
                        <span className="text-xs px-2 py-1 bg-white/10 rounded">
                          {subject.gender === "male" ? "男" : "女"}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {subject.calendarType === "solar" ? "公历" : "农历"}{" "}
                        {subject.birthYear}年{subject.birthMonth}月{subject.birthDay}日{" "}
                        {subject.birthHour.toString().padStart(2, "0")}:
                        {subject.birthMinute.toString().padStart(2, "0")}
                        {subject.isLeapMonth && " (闰月)"}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">{subject.location}</p>
                      {subject.note && (
                        <p className="text-gray-600 text-sm mt-1">{subject.note}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAnalyze(subject)}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm transition-colors"
                      >
                        测算
                      </button>
                      <button
                        onClick={() => handleEdit(subject)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Form Modal */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                onClick={() => setShowForm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="glass rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-2xl font-semibold mb-6">
                    {editingSubject ? "编辑测算对象" : "添加测算对象"}
                  </h2>

                  <div className="space-y-6">
                    {/* Name & Relationship */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">
                          姓名/昵称 <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                          placeholder="请输入姓名"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">关系</label>
                        <select
                          value={formData.relationship}
                          onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                        >
                          {RELATIONSHIP_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-gray-900">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">性别</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: "male" })}
                          className={`px-6 py-2 rounded-lg transition-all ${
                            formData.gender === "male"
                              ? "bg-blue-500 text-white"
                              : "bg-white/10 text-gray-400"
                          }`}
                        >
                          男
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: "female" })}
                          className={`px-6 py-2 rounded-lg transition-all ${
                            formData.gender === "female"
                              ? "bg-pink-500 text-white"
                              : "bg-white/10 text-gray-400"
                          }`}
                        >
                          女
                        </button>
                      </div>
                    </div>

                    {/* Calendar Type */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">日期类型</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, calendarType: "solar" })}
                          className={`px-6 py-2 rounded-lg transition-all ${
                            formData.calendarType === "solar"
                              ? "bg-purple-500 text-white"
                              : "bg-white/10 text-gray-400"
                          }`}
                        >
                          公历
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, calendarType: "lunar" })}
                          className={`px-6 py-2 rounded-lg transition-all ${
                            formData.calendarType === "lunar"
                              ? "bg-purple-500 text-white"
                              : "bg-white/10 text-gray-400"
                          }`}
                        >
                          农历
                        </button>
                      </div>
                    </div>

                    {/* Birth Date */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">年</label>
                        <select
                          value={formData.birthYear}
                          onChange={(e) => setFormData({ ...formData, birthYear: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                        >
                          {years.map((y) => (
                            <option key={y} value={y} className="bg-gray-900">{y}年</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">月</label>
                        <select
                          value={formData.birthMonth}
                          onChange={(e) => setFormData({ ...formData, birthMonth: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                        >
                          {months.map((m) => (
                            <option key={m} value={m} className="bg-gray-900">{m}月</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">日</label>
                        <select
                          value={formData.birthDay}
                          onChange={(e) => setFormData({ ...formData, birthDay: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                        >
                          {days.map((d) => (
                            <option key={d} value={d} className="bg-gray-900">{d}日</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Leap Month */}
                    {formData.calendarType === "lunar" && (
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={formData.isLeapMonth}
                          onChange={(e) => setFormData({ ...formData, isLeapMonth: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        闰月
                      </label>
                    )}

                    {/* Birth Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">时</label>
                        <select
                          value={formData.birthHour}
                          onChange={(e) => setFormData({ ...formData, birthHour: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                        >
                          {hours.map((h) => (
                            <option key={h} value={h} className="bg-gray-900">
                              {h.toString().padStart(2, "0")}时
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">分</label>
                        <select
                          value={formData.birthMinute}
                          onChange={(e) => setFormData({ ...formData, birthMinute: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                        >
                          {minutes.map((m) => (
                            <option key={m} value={m} className="bg-gray-900">
                              {m.toString().padStart(2, "0")}分
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        出生地点 <span className="text-red-400">*</span>
                      </label>
                      <LocationSelect
                        value={formData.location}
                        onChange={(val) => setFormData({ ...formData, location: val })}
                        error={!formData.location}
                      />
                    </div>

                    {/* Note */}
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">备注</label>
                      <textarea
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white resize-none"
                        rows={2}
                        placeholder="可选备注信息"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={() => setShowForm(false)}
                        className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 btn-primary py-3 rounded-xl disabled:opacity-50"
                      >
                        {saving ? "保存中..." : "保存"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
