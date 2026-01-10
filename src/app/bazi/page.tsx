"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

// Feature Components
import { UnifiedInputForm } from "@/features/bazi/components/UnifiedInputForm";
import { BaziResultDashboard } from "@/features/bazi/components/BaziResultDashboard";

// Types
import type { BaziData } from "@/lib/bazi/types";

export default function BaziPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State
  const [baziData, setBaziData] = useState<BaziData | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, string> | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [subjectName, setSubjectName] = useState(""); // Track subject name for display

  // 1. Calculate Bazi
  const handleCalculate = async (formData: any) => {
    // Reset previous result
    setBaziData(null);
    setAnalysis(null);
    setSubjectName(formData.name || ""); // If we add name input back

    try {
      const res = await fetch("/api/bazi/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setBaziData(data.baziData);
        // Scroll to result?
        setTimeout(() => window.scrollTo({ top: 300, behavior: 'smooth' }), 100);
      } else {
        alert(data.message || "排盘失败");
      }
    } catch {
      alert("网络错误，请重试");
    }
  };

  // 2. Generate AI Analysis
  const handleAnalyze = async () => {
    if (!baziData) return;

    if (status === "unauthenticated") {
      // Save data to localStorage or queryparam if needed? 
      // ideally we should open a modal, but for now redirect
      const confirmLogin = confirm("查看AI深度分析需要登录，是否前往登录？");
      if (confirmLogin) {
        router.push("/login?callbackUrl=/bazi");
      }
      return;
    }

    setAnalyzing(true);

    try {
      // We can pass subjectId if we have one managed. For now simple flow:
      const res = await fetch("/api/fortune/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baziData }),
      });

      const data = await res.json();

      if (res.ok) {
        setAnalysis(data.analysis);
      } else if (res.status === 402 || data.code === "INSUFFICIENT_POINTS") {
        const goToRecharge = confirm(`积分不足 (${data.message})，是否前往充值？`);
        if (goToRecharge) router.push("/points");
      } else {
        alert(data.message || "分析失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-gray-800 mb-3">
            <span className="gradient-text">八字排盘</span>
          </h1>
          <p className="text-gray-500">
            探寻生命密码，预见未来运势
          </p>
        </div>

        {/* Input Form Section (Always visible or toggleable? Let's keep it visible at top) */}
        <motion.div
          layout
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <UnifiedInputForm onCalculate={handleCalculate} />
        </motion.div>

        {/* Result Dashboard Section */}
        {baziData && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <BaziResultDashboard
              baziData={baziData}
              analysis={analysis}
              loadingAnalysis={analyzing}
              onAnalyze={handleAnalyze}
              userName={subjectName}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
