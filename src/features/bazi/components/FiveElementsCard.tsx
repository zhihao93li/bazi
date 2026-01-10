"use client";

import { motion } from "framer-motion";
import type { FiveElementsAnalysis } from "@/lib/bazi/types";
import { FIVE_ELEMENTS_CHINESE } from "@/lib/bazi";

// Five Elements Color Mapping
const ELEMENT_COLORS: Record<string, string> = {
    metal: "bg-yellow-400",
    wood: "bg-green-400",
    water: "bg-blue-400",
    fire: "bg-red-400",
    earth: "bg-amber-600",
};

const ELEMENT_TEXT_COLORS: Record<string, string> = {
    metal: "text-yellow-600",
    wood: "text-emerald-600",
    water: "text-blue-600",
    fire: "text-rose-600",
    earth: "text-amber-700",
};

interface FiveElementsCardProps {
    data: FiveElementsAnalysis;
}

export function FiveElementsCard({ data }: FiveElementsCardProps) {
    // Calculate total for percentage
    const total = Object.values(data.distribution).reduce((a, b) => a + b, 0) || 1;

    return (
        <div className="glass-card p-6 md:p-8 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-purple-500">❖</span> 五行能量分布
            </h3>

            <div className="space-y-4">
                {(['wood', 'fire', 'earth', 'metal', 'water'] as const).map((element, index) => {
                    const count = data.distribution[element];
                    const percentage = Math.round((count / total) * 100);

                    return (
                        <div key={element} className="flex items-center gap-4">
                            <div className="w-16 flex-shrink-0 flex items-center gap-2 font-medium">
                                <span className={`w-3 h-3 rounded-full ${ELEMENT_COLORS[element]}`} />
                                <span className="text-gray-700">{FIVE_ELEMENTS_CHINESE[element]}</span>
                            </div>

                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                    className={`h-full rounded-full ${ELEMENT_COLORS[element]}`}
                                />
                            </div>

                            <div className="w-12 text-right text-sm text-gray-500 font-mono">
                                {count}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50/50 p-3 rounded-xl border border-green-100">
                    <span className="text-gray-500 block text-xs mb-1">喜用神</span>
                    <span className="text-green-700 font-medium text-lg">
                        {data.favorable.map(e => FIVE_ELEMENTS_CHINESE[e]).join('、')}
                    </span>
                </div>
                <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                    <span className="text-gray-500 block text-xs mb-1">忌神</span>
                    <span className="text-red-700 font-medium text-lg">
                        {data.unfavorable.map(e => FIVE_ELEMENTS_CHINESE[e]).join('、')}
                    </span>
                </div>
            </div>
        </div>
    );
}
