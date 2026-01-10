"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition, StaggerItem } from "@/components/ui/page-transition";
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
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${d} ${h}:${min}`;
  };

  // Format birth info (lunar date)
  const formatBirthInfo = (info: LunarDateInfo) => {
    return `农历 ${info.yearInChinese}年 ${info.monthInChinese}月 ${info.dayInChinese}`;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-orange)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <PageTransition>
          {/* Page Title - Requirement 12.1: Staggered fade-in-up */}
          <StaggerItem className="text-center mb-8 sm:mb-12">
            <h1 className="text-responsive-title font-semibold mb-3 sm:mb-4 gradient-text">历史记录</h1>
            <p className="text-sm sm:text-base text-[var(--text-muted)]">查看您的命理分析报告</p>
          </StaggerItem>

          {/* Error Message */}
          {error && (
            <StaggerItem>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600"
              >
                {error}
              </motion.div>
            </StaggerItem>
          )}

          {/* 1:2 ratio layout - Reports List : Report Detail */}
          <StaggerItem>
            <div className="layout-two-panel">
            {/* Reports List - 1 part */}
            <div className="panel-list">
              <div className="glass-card p-4 sm:p-6 h-full">
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[var(--text-primary)]">报告列表</h2>
                <div className="space-y-2 sm:space-y-3 max-h-[400px] lg:max-h-[600px] overflow-y-auto pr-1">
                  {reports.map((report) => (
                    <motion.div
                      key={report.id}
                      whileHover={{ scale: 1.01 }}
                      className={`glass-card p-3 sm:p-4 cursor-pointer transition-all duration-200 ${
                        selectedReport?.id === report.id
                          ? "!border-purple-400 !border-2 bg-purple-50/50 shadow-md"
                          : "hover:shadow-md"
                      }`}
                      style={{ 
                        // Prevent hover scale on glass-card when it's a list item
                        transform: 'none'
                      }}
                      onClick={() => handleViewReport(report.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          {report.subjectName && (
                            <div className="text-xs sm:text-sm text-purple-500 font-medium mb-1">
                              {report.subjectName}
                            </div>
                          )}
                          <div className="font-medium text-sm sm:text-base text-[var(--text-primary)] truncate">
                            {formatBirthInfo(report.birthInfo)}
                          </div>
                          <div className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                            {formatDate(report.createdAt)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(report.id);
                          }}
                          disabled={deleting === report.id}
                          className="ml-2 p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
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
                    <div className="text-center text-[var(--text-muted)] py-8">
                      暂无历史记录
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Report Detail - 2 parts */}
            <div className="panel-detail">
              <AnimatePresence mode="wait">
                {loadingDetail ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass-card p-6 sm:p-8 flex items-center justify-center min-h-[300px] lg:min-h-[500px]"
                  >
                    <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-orange)] border-t-transparent rounded-full" />
                  </motion.div>
                ) : selectedReport ? (
                  <motion.div
                    key={selectedReport.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card p-4 sm:p-6 md:p-8"
                  >
                    {/* Birth Info - Lunar Date Display (Requirement 9.4) */}
                    <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-[var(--border-subtle)]">
                      <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-[var(--text-primary)]">出生信息</h3>
                      {selectedReport.subjectName && (
                        <div className="text-purple-500 font-medium mb-2 text-sm sm:text-base">
                          测算对象：{selectedReport.subjectName}
                        </div>
                      )}
                      <div className="text-sm sm:text-base text-[var(--text-muted)]">
                        {formatBirthInfo(selectedReport.birthInfo)}
                      </div>
                    </div>

                    {/* Bazi Chart */}
                    <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-[var(--border-subtle)]">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[var(--text-primary)]">八字四柱</h3>
                      <div className="grid grid-cols-4 gap-2 sm:gap-4">
                        {[
                          { label: "年柱", pillar: selectedReport.baziChart.fourPillars.year },
                          { label: "月柱", pillar: selectedReport.baziChart.fourPillars.month },
                          { label: "日柱", pillar: selectedReport.baziChart.fourPillars.day },
                          { label: "时柱", pillar: selectedReport.baziChart.fourPillars.hour },
                        ].map(({ label, pillar }) => (
                          <div key={label} className="text-center">
                            <div className="text-xs sm:text-sm text-[var(--text-muted)] mb-1 sm:mb-2">{label}</div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-[var(--border-subtle)]">
                              <div className="text-lg sm:text-2xl font-bold text-[var(--text-primary)]">
                                {pillar.heavenlyStem.chinese}
                              </div>
                              <div className="text-lg sm:text-2xl font-bold text-[var(--text-primary)]">
                                {pillar.earthlyBranch.chinese}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 sm:mt-4 text-center text-sm sm:text-base text-[var(--text-muted)]">
                        日主：<span className="text-[var(--text-primary)] font-medium">{selectedReport.baziChart.dayMaster.stem.chinese}</span>
                      </div>
                    </div>

                    {/* Analysis Tabs */}
                    <div className="mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[var(--text-primary)]">命理分析</h3>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                        {ANALYSIS_TABS.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all text-xs sm:text-sm font-medium ${
                              activeTab === tab.id
                                ? "bg-[var(--text-primary)] text-white shadow-md"
                                : "bg-white/60 text-[var(--text-muted)] hover:bg-white/80 border border-[var(--border-subtle)]"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-[var(--border-subtle)]">
                        <div className="whitespace-pre-wrap text-sm sm:text-base text-[var(--text-primary)] leading-relaxed">
                          {selectedReport.analysis[activeTab] || "暂无分析内容"}
                        </div>
                      </div>
                    </div>

                    {/* Meta Info - Generation Time Display (Requirement 9.4) */}
                    <div className="text-xs sm:text-sm text-[var(--text-muted)] flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 pt-3 sm:pt-4 border-t border-[var(--border-subtle)]">
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
                    className="glass-card p-6 sm:p-8 flex items-center justify-center min-h-[300px] lg:min-h-[500px]"
                  >
                    <div className="text-center text-[var(--text-muted)]">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 opacity-40"
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
          </StaggerItem>
        </PageTransition>
      </div>
    </div>
  );
}
