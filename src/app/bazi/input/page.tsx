"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Feature Components
import { UnifiedInputForm } from "@/features/bazi/components/UnifiedInputForm";
import { PageTransition, StaggerItem } from "@/components/ui/page-transition";

export default function BaziInputPage() {
  const router = useRouter();

  // Calculate Bazi and navigate to result page
  const handleCalculate = async (formData: any) => {
    try {
      const res = await fetch("/api/bazi/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // Store result in sessionStorage and navigate to result page
        sessionStorage.setItem("baziResult", JSON.stringify({
          baziData: data.baziData,
          formData: formData,
        }));
        router.push("/bazi");
      } else {
        alert(data.message || "排盘失败");
      }
    } catch {
      alert("网络错误，请重试");
    }
  };

  return (
    <div className="relative min-h-screen pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <PageTransition>
          <StaggerItem className="text-center mb-8 sm:mb-12">
            <h1 className="text-responsive-title font-medium text-[var(--text-primary)] mb-3 sm:mb-4">
              <span className="gradient-text">八字排盘</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-[var(--text-muted)]">
              输入出生信息，探寻生命密码
            </p>
          </StaggerItem>

          {/* Input Form Section */}
          <StaggerItem className="mb-8 sm:mb-12">
            <UnifiedInputForm onCalculate={handleCalculate} />
          </StaggerItem>
        </PageTransition>
      </div>
    </div>
  );
}
