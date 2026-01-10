"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BackgroundBeams } from "@/components/ui/background-beams";

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

  // Get transaction type label and color
  const getTransactionStyle = (type: string) => {
    if (type === "recharge" || type === "gift") {
      return {
        label: type === "recharge" ? "充值" : "赠送",
        color: "text-green-400",
        prefix: "+",
      };
    }
    return {
      label: "消费",
      color: "text-red-400",
      prefix: "",
    };
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black">
      <BackgroundBeams className="absolute inset-0 opacity-30" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 gradient-text">积分中心</h1>
            <p className="text-gray-400">管理您的积分余额和充值</p>
          </div>

          {/* Balance Card */}
          <div className="glass rounded-2xl p-8 mb-8 text-center">
            <div className="text-gray-400 mb-2">当前积分</div>
            <div className="text-5xl font-bold gradient-text mb-4">{balance}</div>
            <div className="text-sm text-gray-500">
              积分可用于命理分析服务
            </div>
          </div>

          {/* Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400"
            >
              {success}
            </motion.div>
          )}

          {/* Packages */}
          <div className="glass rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6">充值套餐</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {packages.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/5 rounded-xl p-6 text-center border border-white/10 hover:border-purple-500/50 transition-all"
                >
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {pkg.points}
                  </div>
                  <div className="text-sm text-gray-400 mb-4">积分</div>
                  <div className="text-xl font-semibold mb-4">
                    {formatPrice(pkg.price)}
                  </div>
                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={purchasing === pkg.id}
                    className="w-full btn-primary py-2 rounded-lg text-sm disabled:opacity-50"
                  >
                    {purchasing === pkg.id ? "处理中..." : "购买"}
                  </button>
                </motion.div>
              ))}
            </div>
            {packages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                暂无可用套餐
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="glass rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-6">积分明细</h2>
            <div className="space-y-4">
              {transactions.map((tx) => {
                const style = getTransactionStyle(tx.type);
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{tx.description}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(tx.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${style.color}`}>
                        {style.prefix}{Math.abs(tx.amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        余额: {tx.balance}
                      </div>
                    </div>
                  </div>
                );
              })}
              {transactions.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  暂无积分记录
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
