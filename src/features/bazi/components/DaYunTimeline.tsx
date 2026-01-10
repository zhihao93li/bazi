"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DaYunInfo, BaziData } from "@/lib/bazi/types";

interface DaYunTimelineProps {
    yun: BaziData['yun'];
}

export function DaYunTimeline({ yun }: DaYunTimelineProps) {
    const [selectedDaYunIndex, setSelectedDaYunIndex] = useState<number>(0);

    if (!yun) return null;

    const selectedDaYun = yun.daYunList[selectedDaYunIndex];

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 md:p-8 mb-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-[var(--text-primary)] flex items-center gap-2">
                    <span className="text-rose-400">❖</span> 大运历程
                    <span className="text-xs font-normal text-[var(--text-muted)] ml-2">
                        ({yun.forward ? '顺行' : '逆行'} · {yun.startAge}岁起运)
                    </span>
                </h3>
            </div>

            {/* Horizontal Scrollable Timeline */}
            <div className="relative mb-8">
                <div className="flex overflow-x-auto pb-4 gap-3 snap-x custom-scrollbar">
                    {yun.daYunList.map((daYun, index) => {
                        const isSelected = selectedDaYunIndex === index;
                        // Check if current calendar year is in range
                        const currentYear = new Date().getFullYear();
                        const isCurrent = daYun.startYear <= currentYear && currentYear <= daYun.endYear;

                        return (
                            <button
                                key={index}
                                onClick={() => setSelectedDaYunIndex(index)}
                                className={`flex-shrink-0 snap-start w-24 h-32 rounded-2xl flex flex-col items-center justify-between p-3 transition-all border relative ${isSelected
                                        ? 'bg-[var(--text-primary)] text-white shadow-lg scale-105 border-[var(--text-primary)]'
                                        : 'bg-white/60 text-[var(--text-primary)] hover:bg-white/80 border-white/50 hover:shadow-md'
                                    } ${isCurrent && !isSelected ? 'ring-2 ring-[var(--accent-orange)] ring-offset-2' : ''}`}
                            >
                                <div className={`text-xs ${isSelected ? 'opacity-80' : 'text-[var(--text-muted)]'}`}>{daYun.startAge}-{daYun.endAge}岁</div>
                                <div className={`text-2xl font-medium ${isSelected ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                                    {daYun.ganZhi}
                                </div>
                                <div className={`text-[10px] ${isSelected ? 'opacity-60' : 'text-[var(--text-muted)]'}`}>{daYun.startYear}起</div>
                                {isCurrent && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-[var(--accent-orange)] rounded-full animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected DaYun Detail (Liu Nian) */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedDaYunIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/50 rounded-2xl p-6 border border-white/40"
                >
                    <h4 className="text-sm font-medium text-[var(--text-primary)] mb-4 flex items-center justify-between">
                        <span>{selectedDaYun?.ganZhi}运 ({selectedDaYun?.startYear} - {selectedDaYun?.endYear}) 流年详情</span>
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {selectedDaYun?.liuNian.map((ln) => {
                            const isThisYear = ln.year === new Date().getFullYear();
                            return (
                                <div
                                    key={ln.year}
                                    className={`p-3 rounded-xl text-center transition-all ${isThisYear 
                                        ? 'bg-[var(--accent-orange)]/10 border border-[var(--accent-orange)]/20 shadow-sm' 
                                        : 'hover:bg-white/60'
                                    }`}
                                >
                                    <div className={`font-medium ${isThisYear ? 'text-[var(--accent-orange)]' : 'text-[var(--text-primary)]'}`}>
                                        {ln.ganZhi}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] mt-1">{ln.year}</div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
