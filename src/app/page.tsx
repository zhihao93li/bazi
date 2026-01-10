"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  {
    icon: "☯",
    title: "精准排盘",
    description: "基于传统命理算法，结合真太阳时校正，精确计算八字四柱与五行分布。",
  },
  {
    icon: "🔮",
    title: "AI 深度解读",
    description: "大模型驱动的性格、事业、财运分析，比传统算命更懂现代人的困惑。",
  },
  {
    icon: "📜",
    title: "永久存档",
    description: "您的每一次探索都将被安全保存，随时回顾这一份来自命运的启示。",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center pt-32 pb-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-6 inline-block px-4 py-1.5 rounded-full bg-white/40 border border-white/50 text-purple-800 text-sm font-medium animate-float">
            ✨ 探索传统智慧与现代科技的融合
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="gradient-text font-serif tracking-tight">
              洞悉命运的
              <br />
              三重境界
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            不仅仅是排盘，更是一次关于自我的深度对话。
            <br />
            <span className="text-purple-600/80 font-medium">精准 · 深刻 · 温暖</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/bazi"
              className="btn-primary text-lg px-10 py-4 shadow-xl shadow-purple-500/20 inline-flex items-center justify-center gap-2 group"
            >
              <span>立即开启</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="px-10 py-4 rounded-xl text-gray-700 font-medium hover:bg-white/40 transition-all border border-transparent hover:border-white/40"
            >
              登录账号
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Feature Cards */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-8 group"
              >
                <div className="text-4xl mb-6 bg-white/50 w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="relative z-10 py-8 text-center text-gray-400 text-sm">
        <p>© 2026 八字命理 | 探索你的数据代码</p>
      </footer>
    </div>
  );
}
