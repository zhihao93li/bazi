"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PillButton } from "@/components/ui/pill-button";
import { SocialProof } from "@/components/ui/social-proof";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { PageTransition, StaggerItem } from "@/components/ui/page-transition";

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
      {/* Hero Section with PageTransition - Requirement 12.1 */}
      <section className="relative z-10 flex flex-col items-center justify-center pt-20 sm:pt-24 md:pt-32 pb-12 md:pb-20 px-4 text-center">
        <PageTransition className="max-w-4xl mx-auto">
          <StaggerItem>
            <div className="mb-4 sm:mb-6 inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/40 border border-white/50 text-purple-800 text-xs sm:text-sm font-medium animate-float">
              ✨ 探索传统智慧与现代科技的融合
            </div>
          </StaggerItem>

          {/* Updated title: responsive sizing for mobile/tablet/desktop */}
          <StaggerItem>
            <h1 className="text-responsive-hero font-medium md:font-semibold mb-6 md:mb-8 leading-tight text-[var(--text-primary)]">
              洞悉命运的
              <br />
              三重境界
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[var(--text-muted)] mb-8 md:mb-10 max-w-2xl mx-auto font-light leading-relaxed px-2">
              不仅仅是排盘，更是一次关于自我的深度对话。
              <br className="hidden sm:block" />
              <span className="text-[var(--accent-orange)] font-medium">精准 · 深刻 · 温暖</span>
            </p>
          </StaggerItem>

          {/* CTA Buttons with PillButton */}
          <StaggerItem>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-6 sm:mb-8 px-4">
              <Link href="/bazi">
                <PillButton size="lg" variant="primary" className="inline-flex items-center gap-2 group">
                  <span>立即排盘</span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </PillButton>
              </Link>
              <Link href="/login">
                <PillButton size="lg" variant="secondary">
                  登录账号
                </PillButton>
              </Link>
            </div>
          </StaggerItem>

          {/* Social Proof Component */}
          <StaggerItem>
            <SocialProof
              rating={5}
              userCount="1000+"
              className="justify-center"
            />
          </StaggerItem>
        </PageTransition>
      </section>

      {/* Feature Cards with BentoGrid */}
      <section className="relative z-10 py-12 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <BentoGrid columns={3} gap="lg">
            {features.map((feature, index) => (
              <BentoGridItem key={feature.title}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card p-5 sm:p-6 md:p-8 h-full group"
                >
                  <div className="text-3xl sm:text-4xl mb-4 sm:mb-6 bg-white/50 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-[var(--text-primary)]">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">{feature.description}</p>
                </motion.div>
              </BentoGridItem>
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="relative z-10 py-8 text-center text-[var(--text-muted)] text-sm">
        <p>© 2026 八字命理 | 探索你的数据代码</p>
      </footer>
    </div>
  );
}
