"use client";

import { motion } from "framer-motion";

interface GlassSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    options: [string, string]; // [uncheckedLabel, checkedLabel]
}

export function GlassSwitch({ checked, onChange, options }: GlassSwitchProps) {
    return (
        <div className="relative inline-flex h-10 w-full items-center rounded-xl bg-white/20 p-1 border border-white/30 backdrop-blur-md">
            {/* Background slide */}
            <motion.div
                className="absolute h-8 w-[calc(50%-4px)] rounded-lg bg-white/80 shadow-sm"
                initial={false}
                animate={{
                    x: checked ? "100%" : "0%",
                    left: checked ? "4px" : "4px"
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />

            {/* Option 1 (Unchecked) */}
            <button
                type="button"
                onClick={() => onChange(false)}
                className={`relative z-10 w-1/2 text-sm font-medium transition-colors duration-200 ${!checked ? "text-purple-700" : "text-gray-500 hover:text-gray-700"
                    }`}
            >
                {options[0]}
            </button>

            {/* Option 2 (Checked) */}
            <button
                type="button"
                onClick={() => onChange(true)}
                className={`relative z-10 w-1/2 text-sm font-medium transition-colors duration-200 ${checked ? "text-purple-700" : "text-gray-500 hover:text-gray-700"
                    }`}
            >
                {options[1]}
            </button>
        </div>
    );
}
