"use client";

import { motion } from "framer-motion";
import type { BaziData } from "@/lib/bazi/types";
import { FourPillarsCard } from "./FourPillarsCard";
import { FiveElementsCard } from "./FiveElementsCard";
import { DaYunTimeline } from "./DaYunTimeline";
import { AnalysisResult } from "./AnalysisResult";

interface BaziResultDashboardProps {
    baziData: BaziData;
    analysis: Record<string, string> | null;
    loadingAnalysis: boolean;
    onAnalyze: () => void;
    userName?: string;
}

export function BaziResultDashboard({
    baziData,
    analysis,
    loadingAnalysis,
    onAnalyze,
    userName
}: BaziResultDashboardProps) {
    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Header Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 mb-8 text-center relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400" />

                <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">
                    {userName ? `${userName}的命盘` : "命理排盘结果"}
                </h2>

                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                    <span>{baziData.lunarDate.yearInChinese}年 (属{baziData.shengXiao})</span>
                    <span>{baziData.lunarDate.monthInChinese}月</span>
                    <span>{baziData.lunarDate.dayInChinese}</span>
                    <span>{baziData.lunarDate.isLeapMonth ? "闰月" : ""}</span>
                </div>

                <div className="mt-4 flex justify-center gap-6 text-xs text-gray-400">
                    <div className="flex flex-col">
                        <span className="mb-1">胎元</span>
                        <span className="font-medium text-gray-600">{baziData.taiYuan}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="mb-1">命宫</span>
                        <span className="font-medium text-gray-600">{baziData.mingGong}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="mb-1">身宫</span>
                        <span className="font-medium text-gray-600">{baziData.shenGong}</span>
                    </div>
                </div>
            </motion.div>

            {/* Main Charts */}
            <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="md:col-span-2">
                    <FourPillarsCard
                        fourPillars={baziData.fourPillars}
                        dayMasterElement={baziData.dayMaster.stem.element}
                    />
                </div>
                <div className="md:col-span-1">
                    <FiveElementsCard data={baziData.fiveElements} />
                </div>
            </div>

            {/* Da Yun Timeline */}
            {baziData.yun && (
                <DaYunTimeline yun={baziData.yun} />
            )}

            {/* AI Analysis */}
            <AnalysisResult
                analysis={analysis}
                loading={loadingAnalysis}
                onAnalyze={onAnalyze}
            />
        </div>
    );
}
