"use client";

import { motion } from "framer-motion";
import type { BaziData } from "@/lib/bazi/types";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
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
        <div className="w-full max-w-5xl mx-auto">
            {/* Header Info - Prismo Glass Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 mb-8 text-center relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
            >
                {/* Gradient accent bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 via-rose-400 to-orange-400" />

                <h2 className="text-2xl font-medium text-[var(--text-primary)] mb-2">
                    {userName ? `${userName}的命盘` : "命理排盘结果"}
                </h2>

                <div className="flex flex-wrap justify-center gap-4 text-sm text-[var(--text-muted)]">
                    <span>{baziData.lunarDate.yearInChinese}年 (属{baziData.shengXiao})</span>
                    <span>{baziData.lunarDate.monthInChinese}月</span>
                    <span>{baziData.lunarDate.dayInChinese}</span>
                    <span>{baziData.lunarDate.isLeapMonth ? "闰月" : ""}</span>
                </div>

                <div className="mt-4 flex justify-center gap-6 text-xs text-[var(--text-muted)]">
                    <div className="flex flex-col">
                        <span className="mb-1">胎元</span>
                        <span className="font-medium text-[var(--text-primary)]">{baziData.taiYuan}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="mb-1">命宫</span>
                        <span className="font-medium text-[var(--text-primary)]">{baziData.mingGong}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="mb-1">身宫</span>
                        <span className="font-medium text-[var(--text-primary)]">{baziData.shenGong}</span>
                    </div>
                </div>
            </motion.div>

            {/* Main Charts - Bento Grid Layout */}
            <BentoGrid columns={3} gap="lg" className="mb-8">
                <BentoGridItem colSpan={2}>
                    <FourPillarsCard
                        fourPillars={baziData.fourPillars}
                        dayMasterElement={baziData.dayMaster.stem.element}
                    />
                </BentoGridItem>
                <BentoGridItem colSpan={1}>
                    <FiveElementsCard data={baziData.fiveElements} />
                </BentoGridItem>
            </BentoGrid>

            {/* Da Yun Timeline */}
            {baziData.yun && (
                <DaYunTimeline yun={baziData.yun} />
            )}

            {/* AI Analysis - with locked/unlocked states */}
            <AnalysisResult
                analysis={analysis}
                loading={loadingAnalysis}
                onAnalyze={onAnalyze}
            />
        </div>
    );
}
