"use client";

import { motion } from "framer-motion";
import type { FourPillars, Pillar } from "@/lib/bazi/types";

// Five Elements Color Mapping (Text Colors)
const ELEMENT_COLORS: Record<string, string> = {
    metal: "text-yellow-600",
    wood: "text-emerald-600",
    water: "text-blue-600",
    fire: "text-rose-600",
    earth: "text-amber-700",
};

// Background colors for the pillars (Very subtle)
const ELEMENT_BG_COLORS: Record<string, string> = {
    metal: "bg-yellow-50/50",
    wood: "bg-emerald-50/50",
    water: "bg-blue-50/50",
    fire: "bg-rose-50/50",
    earth: "bg-amber-50/50",
};

interface FourPillarsCardProps {
    fourPillars: FourPillars;
    dayMasterElement: string;
}

function PillarColumn({ label, pillar, delay }: { label: string; pillar: Pillar; delay: number }) {
    const stemColor = ELEMENT_COLORS[pillar.heavenlyStem.element];
    const branchColor = ELEMENT_COLORS[pillar.earthlyBranch.element];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="flex flex-col items-center"
        >
            <div className="text-xs text-gray-500 mb-2 font-medium tracking-widest uppercase">{label}</div>
            <div className="w-full aspect-[3/4] glass rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden group hover:bg-white/60 transition-colors">
                {/* Dynamic Background Tint based on Branch Element */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${ELEMENT_BG_COLORS[pillar.earthlyBranch.element]}`} />

                <div className="relative z-10 flex flex-col items-center gap-2">
                    {/* Heavenly Stem */}
                    <div className={`text-4xl md:text-5xl font-serif font-bold ${stemColor}`}>
                        {pillar.heavenlyStem.chinese}
                    </div>

                    {/* Earthly Branch */}
                    <div className={`text-4xl md:text-5xl font-serif font-bold ${branchColor}`}>
                        {pillar.earthlyBranch.chinese}
                    </div>
                </div>

                {/* Hidden Stems / NaYin (visible on hover or always?) -> simplified for aesthetic */}
                <div className="mt-4 text-[10px] text-gray-400 text-center font-medium">
                    {pillar.naYin}
                </div>

                <div className="mt-1 flex gap-1 text-[10px] text-gray-500 opacity-60">
                    {pillar.hiddenStems.map(s => s.chinese).join('')}
                </div>
            </div>
        </motion.div>
    );
}

export function FourPillarsCard({ fourPillars }: FourPillarsCardProps) {
    return (
        <div className="glass-card p-6 md:p-8 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="text-purple-500">❖</span> 八字命盘
            </h3>

            <div className="grid grid-cols-4 gap-3 md:gap-6">
                <PillarColumn label="年柱" pillar={fourPillars.year} delay={0} />
                <PillarColumn label="月柱" pillar={fourPillars.month} delay={0.1} />
                <PillarColumn label="日柱" pillar={fourPillars.day} delay={0.2} />
                <PillarColumn label="时柱" pillar={fourPillars.hour} delay={0.3} />
            </div>
        </div>
    );
}
