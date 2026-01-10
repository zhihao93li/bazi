"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Feature Components
import { BaziResultDashboard } from "@/features/bazi/components/BaziResultDashboard";
import { PageTransition, StaggerItem } from "@/components/ui/page-transition";
import { PillButton } from "@/components/ui/pill-button";

// Types
import type { BaziData } from "@/lib/bazi/types";

export default function BaziPage() {
  const { status } = useSession();
  const router = useRouter();

  // State
  const [baziData, setBaziData] = useState<BaziData | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, string> | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);

  // Load result from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("baziResult");
    if (stored) {
      try {
        const { baziData: data, formData } = JSON.parse(stored);
        setBaziData(data);
        setSubjectName(formData?.name || "");
      } catch {
        // Invalid data, redirect to input
        router.replace("/bazi/input");
      }
    }
    setLoading(false);
  }, [router]);

  // Generate AI Analysis
  const handleAnalyze = async () => {
    if (!baziData) return;

    if (status === "unauthenticated") {
      const confirmLogin = confirm("查看AI深度分析需要登录，是否前往登录？");
      if (confirmLogin) {
        router.push("/login?callbackUrl=/bazi");
      }
      return;
    }

    setAnalyzing(true);

    try {
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

  // Handle new calculation
  const handleNewCalculation = () => {
    sessionStorage.removeItem("baziResult");
    router.push("/bazi/input");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="relative min-h-screen pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[50vh]">
          <div className="text-[var(--text-muted)]">加载中...</div>
        </div>
      </div>
    );
  }

  // No data - show prompt to input
  if (!baziData) {
    return (
      <div className="relative min-h-screen pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <PageTransition>
            <StaggerItem className="text-center mb-8 sm:mb-12">
              <h1 className="text-responsive-title font-medium text-[var(--text-primary)] mb-3 sm:mb-4">
                <span className="gradient-text">八字排盘</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-[var(--text-muted)] mb-8">
                探寻生命密码，预见未来运势
              </p>
            </StaggerItem>

            <StaggerItem className="flex flex-col items-center gap-6">
              <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-8 md:p-12 max-w-md mx-auto text-center shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                <div className="text-6xl mb-6">🔮</div>
                <h2 className="text-xl font-medium text-[var(--text-primary)] mb-4">
                  开始您的命理之旅
                </h2>
                <p className="text-[var(--text-muted)] mb-8">
                  输入您的出生信息，即可获取专属八字命盘分析
                </p>
                <PillButton onClick={handleNewCalculation} size="lg" className="w-full">
                  开始排盘
                </PillButton>
              </div>
            </StaggerItem>
          </PageTransition>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <PageTransition>
          <StaggerItem className="text-center mb-8 sm:mb-12">
            <h1 className="text-responsive-title font-medium text-[var(--text-primary)] mb-3 sm:mb-4">
              <span className="gradient-text">八字命盘</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-[var(--text-muted)]">
              您的专属命理分析结果
            </p>
          </StaggerItem>
        </PageTransition>

        {/* Result Dashboard Section */}
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

          {/* New Calculation Button */}
          <div className="mt-8 text-center">
            <button
              onClick={handleNewCalculation}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-sm underline underline-offset-4"
            >
              重新排盘
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
