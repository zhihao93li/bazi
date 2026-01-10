"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { BackgroundBeams } from "@/components/ui/background-beams";

interface UserStats {
  balance: number;
  reportCount: number;
  totalPointsSpent: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<UserStats>({
    balance: 0,
    reportCount: 0,
    totalPointsSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
    }
  }, [status, router]);

  // Fetch user stats
  const fetchStats = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const [pointsRes, reportsRes] = await Promise.all([
        fetch("/api/points"),
        fetch("/api/reports"),
      ]);

      let balance = 0;
      let totalPointsSpent = 0;

      if (pointsRes.ok) {
        const pointsData = await pointsRes.json();
        balance = pointsData.balance;
        // Calculate total spent from consume transactions
        const consumeTransactions = (pointsData.transactions || []).filter(
          (t: { type: string }) => t.type === "consume"
        );
        totalPointsSpent = consumeTransactions.reduce(
          (sum: number, t: { amount: number }) => sum + Math.abs(t.amount),
          0
        );
      }

      let reportCount = 0;
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        reportCount = reportsData.total || 0;
      }

      setStats({
        balance,
        reportCount,
        totalPointsSpent,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchStats();
    }
  }, [session?.user?.id, fetchStats]);

  // Handle logout
  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ callbackUrl: "/" });
  };

  // Mask phone number
  const maskPhone = (phone: string | undefined) => {
    if (!phone || phone.length !== 11) return phone || "";
    return `${phone.slice(0, 3)}****${phone.slice(7)}`;
  };

  // Get display name (username or masked phone)
  const getDisplayName = () => {
    if (session?.user?.username) {
      return session.user.username;
    }
    if (session?.user?.phone) {
      return maskPhone(session.user.phone);
    }
    return "用户";
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

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 gradient-text">用户中心</h1>
            <p className="text-gray-400">管理您的账户信息</p>
          </div>

          {/* User Info Card */}
          <div className="glass rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-6 mb-8">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl">
                ☯
              </div>
              <div>
                <div className="text-2xl font-semibold mb-1">
                  {getDisplayName()}
                </div>
                <div className="text-gray-400">
                  {session?.user?.isNewUser ? "新用户" : "已注册用户"}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {stats.balance}
                </div>
                <div className="text-sm text-gray-400">当前积分</div>
              </div>
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {stats.reportCount}
                </div>
                <div className="text-sm text-gray-400">分析报告</div>
              </div>
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-pink-400 mb-2">
                  {stats.totalPointsSpent}
                </div>
                <div className="text-sm text-gray-400">累计消费</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6">快捷操作</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/bazi"
                className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
              >
                <span className="text-3xl">☯</span>
                <span className="text-sm">八字排盘</span>
              </Link>
              <Link
                href="/history"
                className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
              >
                <span className="text-3xl">📜</span>
                <span className="text-sm">历史记录</span>
              </Link>
              <Link
                href="/points"
                className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
              >
                <span className="text-3xl">💰</span>
                <span className="text-sm">积分充值</span>
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex flex-col items-center gap-3 p-6 bg-white/5 rounded-xl hover:bg-red-500/10 transition-all text-gray-400 hover:text-red-400"
              >
                <span className="text-3xl">🚪</span>
                <span className="text-sm">
                  {loggingOut ? "退出中..." : "退出登录"}
                </span>
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="glass rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-6">账户信息</h2>
            <div className="space-y-4">
              {session?.user?.username && (
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-gray-400">用户名</span>
                  <span>{session.user.username}</span>
                </div>
              )}
              {session?.user?.phone && (
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-gray-400">手机号</span>
                  <span>{maskPhone(session.user.phone)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-400">用户ID</span>
                <span className="text-sm font-mono text-gray-500">
                  {session?.user?.id?.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-400">账户状态</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  正常
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button (Mobile) */}
          <div className="mt-8 md:hidden">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              {loggingOut ? "退出中..." : "退出登录"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
