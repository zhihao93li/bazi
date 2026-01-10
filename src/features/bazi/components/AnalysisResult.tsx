"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PillButton } from "@/components/ui/pill-button";

const ANALYSIS_TABS = [
    { id: "personality", label: "性格分析" },
    { id: "career", label: "事业运势" },
    { id: "wealth", label: "财运分析" },
    { id: "relationship", label: "感情婚姻" },
    { id: "overall", label: "综合建议" },
] as const;

interface AnalysisResultProps {
    analysis: Record<string, string> | null;
    loading: boolean;
    onAnalyze: () => void;
}

export function AnalysisResult({ analysis, loading, onAnalyze }: AnalysisResultProps) {
    const [activeTab, setActiveTab] = useState<string>("personality");

    // Locked state - show blur overlay with orange unlock button
    if (!analysis) {
        return (
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                {/* Preview content with blur overlay */}
                <div className="relative">
                    {/* Blurred preview content */}
                    <div className="blur-sm opacity-50 pointer-events-none select-none">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-[var(--text-primary)] flex items-center gap-2">
                                <span className="text-blue-400">❖</span> AI 深度分析
                            </h3>
                            <div className="flex bg-black/5 p-1 rounded-xl">
                                {ANALYSIS_TABS.slice(0, 3).map((tab) => (
                                    <div
                                        key={tab.id}
                                        className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-muted)]"
                                    >
                                        {tab.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4 text-[var(--text-muted)]">
                            <p>根据您的八字命盘分析，日主为甲木，生于冬季水旺之时...</p>
                            <p>五行分布显示木气偏弱，需要火土来调候平衡...</p>
                            <p>大运走势显示未来十年将进入事业上升期...</p>
                        </div>
                    </div>

                    {/* Overlay with unlock button */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-white/60 via-white/80 to-white/90 backdrop-blur-[2px] rounded-2xl">
                        <div className="text-center">
                            <div className="mb-6 mx-auto w-20 h-20 bg-gradient-to-br from-orange-100 to-rose-100 rounded-full flex items-center justify-center text-4xl shadow-lg">
                                🔮
                            </div>
                            <h3 className="text-2xl font-medium text-[var(--text-primary)] mb-3">AI 深度解读</h3>
                            <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto leading-relaxed">
                                基于大语言模型，结合您的八字命盘，为您提供关于性格、事业、财运、情感的全方位深度解析。
                            </p>
                            
                            {/* Orange unlock button - Prismo accent */}
                            <button
                                onClick={onAnalyze}
                                disabled={loading}
                                className="bg-[var(--accent-orange)] text-white font-medium rounded-full px-8 py-3.5 text-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-200 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        正在解读天机...
                                    </span>
                                ) : (
                                    "解锁详细分析"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Unlocked state - show content in tabbed format
    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]" id="analysis-result">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                <h3 className="text-lg font-medium text-[var(--text-primary)] flex items-center gap-2 mb-4 md:mb-0">
                    <span className="text-blue-400">❖</span> AI 深度分析
                </h3>

                {/* Tabs - Prismo style */}
                <div className="flex bg-black/5 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                    {ANALYSIS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white text-[var(--text-primary)] shadow-sm'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="prose prose-neutral max-w-none text-[var(--text-primary)] leading-relaxed"
                    >
                        {analysis[activeTab] ? (
                            <div className="whitespace-pre-wrap">
                                {analysis[activeTab]}
                            </div>
                        ) : (
                            <div className="text-[var(--text-muted)] italic text-center py-10">
                                暂无该板块内容，请确保AI分析已完成。
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
