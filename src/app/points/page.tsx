"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PillButton } from "@/components/ui/pill-button";
import { PageTransition, StaggerItem } from "@/components/ui/page-transition";

interface PointsPackage {
  id: string;
  name: string;
  points: number;
  price: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

export default function PointsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [packages, setPackages] = useState<PointsPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/points");
    }
  }, [status, router]);

  // Fetch points data
  const fetchPointsData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const [pointsRes, packagesRes] = await Promise.all([
        fetch("/api/points"),
        fetch("/api/points/packages"),
      ]);

      if (pointsRes.ok) {
        const pointsData = await pointsRes.json();
        setBalance(pointsData.balance);
        setTransactions(pointsData.transactions || []);
      }

      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(packagesData.packages || []);
      }
    } catch {
      setError("加载数据失败");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPointsData();
    }
  }, [session?.user?.id, fetchPointsData]);

  // Handle purchase
  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId);
    setError("");
    setSuccess("");

    try {
      // Create order
      const orderRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, platform: "pc" }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        setError(orderData.message || "创建订单失败");
        return;
      }

      // Mock confirm payment (development only)
      const confirmRes = await fetch("/api/payment/mock-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo: orderData.orderNo }),
      });

      const confirmData = await confirmRes.json();

      if (confirmRes.ok) {
        setSuccess(`充值成功！获得 ${confirmData.pointsAdded} 积分`);
        // Refresh data
        fetchPointsData();
      } else {
        setError(confirmData.message || "支付确认失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setPurchasing(null);
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return `¥${(price / 100).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get transaction type label and color - Prismo style color coding
  const getTransactionStyle = (type: string) => {
    if (type === "recharge" || type === "gift") {
      return {
        label: type === "recharge" ? "充值" : "赠送",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        prefix: "+",
      };
    }
    return {
      label: "消费",
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      prefix: "-",
    };
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <PageTransition>
          {/* Page Title - Requirement 12.1: Staggered fade-in-up */}
          <StaggerItem className="text-center mb-8 sm:mb-12">
            <h1 className="text-responsive-title font-semibold mb-3 sm:mb-4 text-[var(--text-primary)]">
              积分中心
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-muted)]">管理您的积分余额和充值</p>
          </StaggerItem>

          {/* Balance Card - Requirement 10.1: Large gradient text */}
          <StaggerItem className="glass-card p-6 sm:p-8 md:p-12 mb-6 sm:mb-8 text-center">
            <div className="text-[var(--text-muted)] mb-2 sm:mb-3 text-base sm:text-lg">当前积分</div>
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold gradient-text mb-3 sm:mb-4">
              {balance.toLocaleString()}
            </div>
            <div className="text-xs sm:text-sm text-[var(--text-muted)]">
              积分可用于命理分析服务
            </div>
          </StaggerItem>

          {/* Messages */}
          {error && (
            <StaggerItem>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-8 p-3 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl text-rose-600 text-sm sm:text-base"
              >
                {error}
              </motion.div>
            </StaggerItem>
          )}

          {success && (
            <StaggerItem>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-8 p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl text-emerald-600 text-sm sm:text-base"
              >
                {success}
              </motion.div>
            </StaggerItem>
          )}

          {/* Packages - Requirement 10.2: Four-column layout, 10.3: Hover scale */}
          <StaggerItem
            className="glass-card no-hover-scale p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-[var(--text-primary)]">充值套餐</h2>
            <div className="grid-packages">
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/80 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center border border-[var(--border-subtle)] 
                             hover:border-[var(--accent-orange)] hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">
                    {pkg.points}
                  </div>
                  <div className="text-xs sm:text-sm text-[var(--text-muted)] mb-3 sm:mb-4">积分</div>
                  <div className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">
                    {formatPrice(pkg.price)}
                  </div>
                  <PillButton
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchasing === pkg.id}
                    size="sm"
                    className="w-full"
                  >
                    {purchasing === pkg.id ? "处理中..." : "购买"}
                  </PillButton>
                </motion.div>
              ))}
            </div>
            {packages.length === 0 && (
              <div className="text-center text-[var(--text-muted)] py-6 sm:py-8 text-sm sm:text-base">
                暂无可用套餐
              </div>
            )}
          </StaggerItem>

          {/* Transaction History - Requirement 10.4: Color coding */}
          <StaggerItem
            className="glass-card no-hover-scale p-4 sm:p-6 md:p-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-[var(--text-primary)]">积分明细</h2>
            <div className="space-y-2 sm:space-y-3">
              {transactions.map((tx, index) => {
                const style = getTransactionStyle(tx.type);
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                    className="flex items-center justify-between p-3 sm:p-4 bg-white/60 rounded-lg sm:rounded-xl 
                               border border-[var(--border-subtle)] hover:bg-white/80 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base text-[var(--text-primary)] truncate">
                        {tx.description}
                      </div>
                      <div className="text-xs sm:text-sm text-[var(--text-muted)]">
                        {formatDate(tx.createdAt)}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div 
                        className={`font-semibold text-base sm:text-lg ${style.color}`}
                        data-transaction-type={tx.type}
                      >
                        {style.prefix}{Math.abs(tx.amount)}
                      </div>
                      <div className="text-xs sm:text-sm text-[var(--text-muted)]">
                        余额: {tx.balance.toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {transactions.length === 0 && (
                <div className="text-center text-[var(--text-muted)] py-6 sm:py-8 text-sm sm:text-base">
                  暂无积分记录
                </div>
              )}
            </div>
          </StaggerItem>
        </PageTransition>
      </div>
    </div>
  );
}
