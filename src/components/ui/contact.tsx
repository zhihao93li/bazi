"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    console.log("Form submitted:", formData);
    alert("感谢您的留言，我们会尽快联系您！");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="max-w-[1160px] mx-auto px-5 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-[32px] md:text-[40px] font-semibold text-[var(--dark-7)] mb-6">
              还有疑问？
              <br />
              <span className="text-[var(--accent-purple)]">随时联系我们</span>
            </h2>
            <p className="text-[var(--grey-50)] text-lg mb-8 leading-relaxed">
              无论是关于排盘结果的疑问，还是对产品的建议，我们都乐意聆听。
              我们的专业命理师团队和技术支持将在 24 小时内回复您。
            </p>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--light-94)] flex items-center justify-center text-[var(--accent-purple)]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--dark-7)]">发送邮件</h3>
                  <p className="text-[var(--grey-50)]">support@bazi.ai</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--light-94)] flex items-center justify-center text-[var(--accent-pink)]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--dark-7)]">在线客服</h3>
                  <p className="text-[var(--grey-50)]">工作日 9:00 - 18:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <motion.div
            className="glass-card p-8 md:p-10"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--dark-7)]">姓名</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[var(--border-subtle)] focus:ring-2 focus:ring-[var(--accent-purple)] focus:border-transparent outline-none transition-all"
                    placeholder="您的称呼"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--dark-7)]">邮箱</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[var(--border-subtle)] focus:ring-2 focus:ring-[var(--accent-purple)] focus:border-transparent outline-none transition-all"
                    placeholder="您的联系邮箱"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--dark-7)]">主题</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[var(--border-subtle)] focus:ring-2 focus:ring-[var(--accent-purple)] focus:border-transparent outline-none transition-all"
                  placeholder="咨询主题"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--dark-7)]">留言内容</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-[var(--border-subtle)] focus:ring-2 focus:ring-[var(--accent-purple)] focus:border-transparent outline-none transition-all resize-none"
                  placeholder="请详细描述您的问题..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[var(--dark-7)] text-white font-medium rounded-xl hover:bg-[var(--grey-24)] hover:-translate-y-1 transition-all duration-200 shadow-lg"
              >
                发送留言
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
