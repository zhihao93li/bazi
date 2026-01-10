"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
    label: string;
    value: string | number;
}

interface GlassSelectProps {
    value: string | number;
    onChange: (value: string | number) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
}

export function GlassSelect({
    value,
    onChange,
    options,
    placeholder = "请选择",
    className = "",
}: GlassSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full text-left px-4 py-3 rounded-xl bg-white/40 border border-white/60 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all flex items-center justify-between group ${isOpen ? 'ring-2 ring-purple-400/50 bg-white/60' : 'hover:bg-white/50'}`}
            >
                <span className={`block truncate ${!selectedOption ? "text-gray-400" : ""}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg
                        className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute z-50 mt-2 w-full max-h-60 overflow-auto rounded-xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg ring-1 ring-black/5 focus:outline-none custom-scrollbar"
                    >
                        <div className="py-1">
                            {options.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`relative cursor-pointer select-none py-2.5 pl-4 pr-9 transition-colors ${value === option.value
                                            ? "bg-purple-100/50 text-purple-900 font-medium"
                                            : "text-gray-700 hover:bg-purple-50/50 hover:text-purple-700"
                                        }`}
                                >
                                    <span className="block truncate">{option.label}</span>
                                    {value === option.value && (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-purple-600">
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                            ))}
                            {options.length === 0 && (
                                <div className="py-4 text-center text-sm text-gray-500">
                                    无选项
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
