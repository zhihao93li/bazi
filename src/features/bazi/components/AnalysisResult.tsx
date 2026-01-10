"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

    if (!analysis) {
        return (
            <div className="glass-card p-8 text-center">
                <div className="mb-6 mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl">
                    🤖
                </div>
                <h3 className="text-xl font-serif font-bold text-gray-800 mb-3">AI 深度解读</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    基于大语言模型，结合您的八字命盘，为您提供关于性格、事业、财运、情感的全方位深度解析。
                </p>
                <button
                    onClick={onAnalyze}
                    disabled={loading}
                    className="btn-primary px-8 py-3 shadow-lg shadow-purple-200"
                >
                    {loading ? "正在解读天机..." : "解锁详细分析"}
                </button>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 md:p-8" id="analysis-result">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 md:mb-0">
                    <span className="text-blue-500">❖</span> AI 深度分析
                </h3>

                {/* Tabs */}
                <div className="flex bg-white/40 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                    {ANALYSIS_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white text-purple-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
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
                        className="prose prose-purple max-w-none text-gray-700 leading-relaxed"
                    >
                        {/* Use a markdown renderer generally, but for now simple text handling */}
                        {analysis[activeTab] ? (
                            <div className="whitespace-pre-wrap">
                                {analysis[activeTab]}
                            </div>
                        ) : (
                            <div className="text-gray-400 italic text-center py-10">
                                暂无该板块内容，请确保AI分析已完成。
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
