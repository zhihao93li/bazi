"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundBeams } from "@/components/ui/background-beams";
import type { LunarDateInfo, BaziData } from "@/lib/bazi/types";

interface ReportSummary {
  id: string;
  subjectId?: string | null;
  subjectName?: string;
  birthInfo: LunarDateInfo;
  pointsCost: number;
  createdAt: string;
}

interface ReportDetail {
  id: string;
  subjectId?: string | null;
  subjectName?: string;
  birthInfo: LunarDateInfo;
  baziChart: BaziData;
  analysis: Record<string, string>;
  pointsCost: number;
  createdAt: string;
}

// Analysis tabs
const ANALYSIS_TABS = [
  { id: "personality", label: "性格分析" },
  { id: "career", label: "事业运势" },
  { id: "wealth", label: "财运分析" },
  { id: "relationship", label: "感情运势" },
  { id: "overall", label: "综合建议" },
];

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [activeTab, setActiveTab] = useState("personality");
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/history");
    }
  }, [status, router]);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {
      setError("加载历史记录失败");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchReports();
    }
  }, [session?.user?.id, fetchReports]);

  // Fetch report detail
  const handleViewReport = async (reportId: string) => {
    setLoadingDetail(true);
    setError("");

    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedReport(data.report);
        setActiveTab("personality");
      } else {
        setError("加载报告详情失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Delete report
  const handleDelete = async (reportId: string) => {
    if (!confirm("确定要删除这条记录吗？")) return;

    setDeleting(reportId);
    setError("");

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setReports(reports.filter((r) => r.id !== reportId));
        if (selectedReport?.id === reportId) {
          setSelectedReport(null);
        }
      } else {
        setError("删除失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setDeleting(null);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format birth info
  const formatBirthInfo = (info: LunarDateInfo) => {
    return `农历 ${info.yearInChinese}年 ${info.monthInChinese}月 ${info.dayInChinese}`;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

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
            <h1 className="text-4xl font-bold mb-4 gradient-text">历史记录</h1>
            <p className="text-gray-400">查看您的命理分析报告</p>
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

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Reports List */}
            <div className="lg:col-span-1">
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">报告列表</h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {reports.map((report) => (
                    <motion.div
                      key={report.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedReport?.id === report.id
                          ? "bg-purple-500/20 border border-purple-500/50"
                          : "bg-white/5 border border-white/10 hover:border-white/20"
                      }`}
                      onClick={() => handleViewReport(report.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          {report.subjectName && (
                            <div className="text-sm text-purple-400 mb-1">
                              {report.subjectName}
                            </div>
                          )}
                          <div className="font-medium truncate">
                            {formatBirthInfo(report.birthInfo)}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {formatDate(report.createdAt)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(report.id);
                          }}
                          disabled={deleting === report.id}
                          className="ml-2 p-2 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          {deleting === report.id ? (
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {reports.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      暂无历史记录
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Report Detail */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {loadingDetail ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass rounded-2xl p-8 flex items-center justify-center min-h-[400px]"
                  >
                    <div className="text-gray-400">加载中...</div>
                  </motion.div>
                ) : selectedReport ? (
                  <motion.div
                    key={selectedReport.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass rounded-2xl p-8"
                  >
                    {/* Birth Info */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">出生信息</h3>
                      {selectedReport.subjectName && (
                        <div className="text-purple-400 mb-1">
                          测算对象：{selectedReport.subjectName}
                        </div>
                      )}
                      <div className="text-gray-400">
                        {formatBirthInfo(selectedReport.birthInfo)}
                      </div>
                    </div>

                    {/* Bazi Chart */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">八字四柱</h3>
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { label: "年柱", pillar: selectedReport.baziChart.fourPillars.year },
                          { label: "月柱", pillar: selectedReport.baziChart.fourPillars.month },
                          { label: "日柱", pillar: selectedReport.baziChart.fourPillars.day },
                          { label: "时柱", pillar: selectedReport.baziChart.fourPillars.hour },
                        ].map(({ label, pillar }) => (
                          <div key={label} className="text-center">
                            <div className="text-sm text-gray-400 mb-2">{label}</div>
                            <div className="bg-white/5 rounded-xl p-3">
                              <div className="text-2xl font-bold">
                                {pillar.heavenlyStem.chinese}
                              </div>
                              <div className="text-2xl font-bold">
                                {pillar.earthlyBranch.chinese}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 text-center text-gray-400">
                        日主：<span className="text-white font-medium">{selectedReport.baziChart.dayMaster.stem.chinese}</span>
                      </div>
                    </div>

                    {/* Analysis Tabs */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">命理分析</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
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
                      <div className="bg-white/5 rounded-xl p-6">
                        <div className="whitespace-pre-wrap text-gray-300">
                          {selectedReport.analysis[activeTab] || "暂无分析内容"}
                        </div>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="text-sm text-gray-500 flex justify-between">
                      <span>消耗积分：{selectedReport.pointsCost}</span>
                      <span>生成时间：{formatDate(selectedReport.createdAt)}</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass rounded-2xl p-8 flex items-center justify-center min-h-[400px]"
                  >
                    <div className="text-center text-gray-500">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 opacity-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p>选择一条记录查看详情</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
