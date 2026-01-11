"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "AI 算命真的准确吗？",
    answer: "我们的系统结合了传统的八字命理算法（如排盘、五行计算）和现代的大语言模型（LLM）技术。算法确保了基础数据的绝对准确，而 AI 则基于海量命理古籍和案例进行深度解读，能够提供比传统模版更灵活、更具洞察力的分析结果。但请记住，命理分析仅供参考，命运掌握在自己手中。",
  },
  {
    question: "我的个人隐私数据安全吗？",
    answer: "我们非常重视您的隐私保护。您的出生日期等敏感信息仅用于生成命理报告，系统会采用加密传输和存储。我们承诺绝不会将您的个人信息出售给第三方。您可以随时在用户中心删除您的历史数据。",
  },
  {
    question: "基础版和专业版有什么区别？",
    answer: "基础版提供标准的四柱八字排盘和基础的五行分析，适合对命理有一定了解或仅需简单查看的用户。专业版则包含由 AI 生成的深度解读报告（约5000字），涵盖事业、财运、情感、健康等维度的详细分析，以及针对性的运势建议。",
  },
  {
    question: "如果不满意可以退款吗？",
    answer: "由于数字产品的特殊性，报告一旦生成无法回收，因此原则上不支持退款。但如果您遇到系统故障导致报告无法生成或内容严重缺失，请联系客服，我们将为您人工处理或全额退款。",
  },
  {
    question: "可以为他人测算吗？",
    answer: "当然可以。只要您拥有对方准确的出生时间（建议精确到小时），就可以在系统中添加新的档案进行测算。专业版用户支持保存多个档案，方便您为家人朋友进行分析。",
  },
];

const AccordionItem = ({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <div className="border-b border-[var(--border-subtle)] last:border-none">
      <button
        className="flex items-center justify-between w-full py-6 text-left group"
        onClick={onClick}
      >
        <span className={`text-lg font-medium transition-colors ${isOpen ? "text-[var(--accent-purple)]" : "text-[var(--dark-7)] group-hover:text-[var(--accent-purple)]"}`}>
          {question}
        </span>
        <span className={`ml-4 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
          <svg className="w-6 h-6 text-[var(--grey-50)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-[16px] text-[var(--grey-50)] leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-[var(--light-94)]">
      <div className="max-w-[800px] mx-auto px-5">
        <div className="text-center mb-16">
          <h2 className="text-[32px] md:text-[40px] font-semibold text-[var(--dark-7)] mb-4">
            常见问题解答
          </h2>
          <p className="text-[var(--grey-50)] text-lg">
            关于八字命理和 AI 分析的疑问，这里都有答案
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
