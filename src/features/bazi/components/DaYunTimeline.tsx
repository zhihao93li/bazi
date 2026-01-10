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

    // Find current DaYun index on mount if possible
    // Effects are better for this but for simplicity we default to 0 or logic in parent
    // We can let user explore.

    const selectedDaYun = yun.daYunList[selectedDaYunIndex];

    return (
        <div className="glass-card p-6 md:p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-pink-500">❖</span> 大运历程
                    <span className="text-xs font-normal text-gray-500 ml-2">
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
                                className={`flex-shrink-0 snap-start w-24 h-32 rounded-xl flex flex-col items-center justify-between p-3 transition-all border ${isSelected
                                        ? 'bg-purple-600 text-white shadow-lg scale-105 border-purple-600'
                                        : 'bg-white/40 text-gray-600 hover:bg-white/60 border-white/50'
                                    } ${isCurrent && !isSelected ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`}
                            >
                                <div className="text-xs opacity-80">{daYun.startAge}-{daYun.endAge}岁</div>
                                <div className={`text-2xl font-serif font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                    {daYun.ganZhi}
                                </div>
                                <div className="text-[10px] opacity-60">{daYun.startYear}起</div>
                                {isCurrent && (
                                    <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
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
                    className="bg-white/30 rounded-2xl p-6 border border-white/40"
                >
                    <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center justify-between">
                        <span>{selectedDaYun?.ganZhi}运 ({selectedDaYun?.startYear} - {selectedDaYun?.endYear}) 流年详情</span>
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {selectedDaYun?.liuNian.map((ln) => {
                            const isThisYear = ln.year === new Date().getFullYear();
                            return (
                                <div
                                    key={ln.year}
                                    className={`p-3 rounded-lg text-center transition-colors ${isThisYear ? 'bg-purple-100 border border-purple-200 shadow-sm' : 'hover:bg-white/40'
                                        }`}
                                >
                                    <div className={`font-medium ${isThisYear ? 'text-purple-700' : 'text-gray-800'}`}>
                                        {ln.ganZhi}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{ln.year}</div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
