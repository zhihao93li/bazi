"use client";

import { motion } from "framer-motion";
import type { FiveElementsAnalysis } from "@/lib/bazi/types";
import { FIVE_ELEMENTS_CHINESE } from "@/lib/bazi";

// Five Elements Color Mapping - Prismo warm tones
const ELEMENT_COLORS: Record<string, string> = {
    metal: "bg-amber-400",
    wood: "bg-emerald-400",
    water: "bg-blue-400",
    fire: "bg-rose-400",
    earth: "bg-orange-500",
};

const ELEMENT_TEXT_COLORS: Record<string, string> = {
    metal: "text-amber-500",
    wood: "text-emerald-500",
    water: "text-blue-500",
    fire: "text-rose-500",
    earth: "text-orange-600",
};

interface FiveElementsCardProps {
    data: FiveElementsAnalysis;
}

export function FiveElementsCard({ data }: FiveElementsCardProps) {
    // Calculate total for percentage
    const total = Object.values(data.distribution).reduce((a, b) => a + b, 0) || 1;

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 md:p-8 h-full shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <span className="text-[var(--accent-orange)]">❖</span> 五行能量分布
            </h3>

            <div className="space-y-4">
                {(['wood', 'fire', 'earth', 'metal', 'water'] as const).map((element, index) => {
                    const count = data.distribution[element];
                    const percentage = Math.round((count / total) * 100);

                    return (
                        <div key={element} className="flex items-center gap-4">
                            <div className="w-16 flex-shrink-0 flex items-center gap-2 font-medium">
                                <span className={`w-3 h-3 rounded-full ${ELEMENT_COLORS[element]}`} />
                                <span className="text-[var(--text-primary)]">{FIVE_ELEMENTS_CHINESE[element]}</span>
                            </div>

                            <div className="flex-1 h-3 bg-black/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                    className={`h-full rounded-full ${ELEMENT_COLORS[element]}`}
                                />
                            </div>

                            <div className="w-12 text-right text-sm text-[var(--text-muted)] font-mono">
                                {count}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-6 border-t border-black/5 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-100">
                    <span className="text-[var(--text-muted)] block text-xs mb-1">喜用神</span>
                    <span className="text-emerald-600 font-medium text-lg">
                        {data.favorable.map(e => FIVE_ELEMENTS_CHINESE[e]).join('、')}
                    </span>
                </div>
                <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-100">
                    <span className="text-[var(--text-muted)] block text-xs mb-1">忌神</span>
                    <span className="text-rose-600 font-medium text-lg">
                        {data.unfavorable.map(e => FIVE_ELEMENTS_CHINESE[e]).join('、')}
                    </span>
                </div>
            </div>
        </div>
    );
}
