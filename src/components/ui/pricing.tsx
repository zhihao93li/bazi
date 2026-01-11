"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GlassSwitch } from "./glass-switch";

const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-[var(--accent-green)] shrink-0"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

interface PricingPlan {
  title: string;
  price: { monthly: string; yearly: string };
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  href: string;
}

const plans: PricingPlan[] = [
  {
    title: "基础版",
    price: { monthly: "¥0", yearly: "¥0" },
    description: "适合初学者体验八字命理基础功能",
    features: [
      "基础四柱排盘",
      "五行强弱分析",
      "基础大运流年",
      "每日运势简报",
    ],
    buttonText: "免费开始",
    href: "/bazi/input",
  },
  {
    title: "专业版",
    price: { monthly: "¥19.9", yearly: "¥199" },
    description: "解锁 AI 深度解读与详细运势分析",
    features: [
      "包含基础版所有功能",
      "AI 深度命理解读 (5000字)",
      "流年流月详细运势",
      "事业财运情感专项分析",
      "PDF 报告导出",
    ],
    popular: true,
    buttonText: "立即升级",
    href: "/pricing/pro",
  },
  {
    title: "终身版",
    price: { monthly: "¥599", yearly: "¥599" },
    description: "一次付费，终身享受所有高级功能",
    features: [
      "包含专业版所有功能",
      "终身无限次 AI 解读",
      "专属命理师顾问支持",
      "新功能优先体验",
      "多用户档案管理 (无限制)",
    ],
    buttonText: "获取终身版",
    href: "/pricing/lifetime",
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(138,67,225,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-[1160px] mx-auto px-5 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-[32px] md:text-[40px] font-semibold text-[var(--dark-7)] mb-4">
            灵活的付费方案
          </h2>
          <p className="text-[var(--grey-50)] text-lg mb-8 max-w-[600px] mx-auto">
            选择最适合您的方案，开启您的命理探索之旅。
            无论是偶尔查看还是深入研究，我们都有合适的计划。
          </p>
          
          <div className="flex justify-center mb-12">
            <div className="w-[240px]">
              <GlassSwitch
                checked={isYearly}
                onChange={setIsYearly}
                options={["月付", "年付 (省 20%)"]}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <motion.div
              key={plan.title}
              className={`glass-card p-8 flex flex-col relative ${
                plan.popular ? "border-[var(--accent-purple)] ring-1 ring-[var(--accent-purple)] shadow-[0_8px_30px_rgba(138,67,225,0.15)]" : ""
              }`}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-[var(--accent-purple)] text-white text-xs font-semibold rounded-full">
                  最受欢迎
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-[var(--dark-7)] mb-2">
                  {plan.title}
                </h3>
                <p className="text-[var(--grey-50)] text-sm h-[40px]">
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold text-[var(--dark-7)]">
                  {isYearly && plan.title !== "终身版" ? plan.price.yearly : plan.price.monthly}
                </span>
                {plan.title !== "基础版" && plan.title !== "终身版" && (
                  <span className="text-[var(--grey-50)] ml-1">
                    /{isYearly ? "年" : "月"}
                  </span>
                )}
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-[15px] text-[var(--dark-7)]">
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  plan.popular
                    ? "bg-[var(--dark-7)] text-white hover:bg-[var(--grey-24)] shadow-lg hover:shadow-xl"
                    : "bg-white text-[var(--dark-7)] border border-[var(--border-subtle)] hover:bg-[var(--light-94)]"
                }`}
              >
                {plan.buttonText}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
