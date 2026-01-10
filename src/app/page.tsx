"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PrismoHeroBackground } from "@/components/ui/prismo-hero-background";

const StarIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--light-95)]">
      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex flex-col">
        {/* Prismo Background */}
        <PrismoHeroBackground />

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-5 pt-[100px] pb-[60px]">
          <motion.div
            className="max-w-[800px] flex flex-col items-center gap-8 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/30 rounded-full backdrop-blur-[10px]">
              <span className="text-[15px] font-semibold bg-gradient-to-r from-[var(--accent-red)] via-[var(--accent-orange)] to-[var(--accent-purple)] bg-clip-text text-transparent">
                1000+
              </span>
              <span className="text-[15px] font-medium text-[var(--dark-7)]">
                用户信赖
              </span>
            </div>

            {/* Title */}
            <h1 className="text-[56px] font-semibold leading-[1.15] text-[var(--dark-7)] max-md:text-[40px] max-sm:text-[32px]">
              AI 智能命理分析
            </h1>

            {/* Subtitle */}
            <p className="text-[18px] font-medium text-[var(--grey-50)] leading-[1.6] max-w-[500px] max-sm:text-[16px]">
              基于传统八字命理与现代 AI 技术
              <br />
              为您提供精准、深刻的命理解读
            </p>

            {/* CTA */}
            <Link
              href="/bazi/input"
              className="inline-flex items-center justify-center px-8 py-4 bg-[var(--dark-7)] text-white text-[16px] font-medium rounded-full transition-all duration-200 hover:bg-[var(--grey-24)] hover:-translate-y-0.5 shadow-lg"
            >
              立即排盘
            </Link>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 text-[var(--dark-12)]">
                <StarIcon />
                <StarIcon />
                <StarIcon />
                <StarIcon />
                <StarIcon />
              </div>
              <span className="text-[14px] font-medium text-[var(--grey-50)]">
                5.0 评分
              </span>
            </div>
          </motion.div>
        </div>

        {/* Simple Footer */}
        <footer className="relative z-10 py-6 text-center">
          <p className="text-[13px] text-[var(--grey-50)]">
            © {new Date().getFullYear()} 八字命理
          </p>
        </footer>
      </section>
    </div>
  );
}
