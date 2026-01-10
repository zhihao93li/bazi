"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PillButton } from "@/components/ui/pill-button";
import { PageTransition, StaggerItem } from "@/components/ui/page-transition";

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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <PageTransition>
          {/* Page Title - Requirement 12.1: Staggered fade-in-up */}
          <StaggerItem className="text-center mb-8 sm:mb-12">
            <h1 className="text-responsive-title font-semibold mb-3 sm:mb-4 text-[var(--text-primary)]">
              用户中心
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-muted)]">管理您的账户信息</p>
          </StaggerItem>

          {/* User Info Card - Requirement 11.1: Avatar, username/phone, three-column statistics */}
          <StaggerItem
            className="glass-card no-hover-scale p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
          >
            {/* User Info Header */}
            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Avatar */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 flex items-center justify-center text-2xl sm:text-3xl shadow-lg flex-shrink-0">
                ☯
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-semibold text-[var(--text-primary)] mb-1 truncate">
                  {getDisplayName()}
                </div>
                <div className="text-sm sm:text-base text-[var(--text-muted)]">
                  {session?.user?.isNewUser ? "新用户" : "已注册用户"}
                </div>
              </div>
            </div>

            {/* Stats Grid - Requirement 11.1: Three-column statistics */}
            <div className="grid-stats">
              <div className="bg-white/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center border border-[var(--border-subtle)]">
                <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">
                  {stats.balance}
                </div>
                <div className="text-xs sm:text-sm text-[var(--text-muted)]">当前积分</div>
              </div>
              <div className="bg-white/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center border border-[var(--border-subtle)]">
                <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">
                  {stats.reportCount}
                </div>
                <div className="text-xs sm:text-sm text-[var(--text-muted)]">分析报告</div>
              </div>
              <div className="bg-white/60 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center border border-[var(--border-subtle)]">
                <div className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">
                  {stats.totalPointsSpent}
                </div>
                <div className="text-xs sm:text-sm text-[var(--text-muted)]">累计消费</div>
              </div>
            </div>
          </StaggerItem>

          {/* Quick Actions - Requirement 11.2 & 11.3: Four-grid icon button layout */}
          <StaggerItem
            className="glass-card no-hover-scale p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-[var(--text-primary)]">快捷操作</h2>
            <div className="grid-actions">
              {/* Bazi - Requirement 11.3 */}
              <Link href="/bazi">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-white/60 rounded-xl sm:rounded-2xl 
                             border border-[var(--border-subtle)] hover:border-[var(--accent-orange)] 
                             hover:shadow-lg transition-all cursor-pointer"
                >
                  <span className="text-2xl sm:text-3xl">☯</span>
                  <span className="text-xs sm:text-sm text-[var(--text-primary)]">八字排盘</span>
                </motion.div>
              </Link>
              
              {/* History - Requirement 11.3 */}
              <Link href="/history">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-white/60 rounded-xl sm:rounded-2xl 
                             border border-[var(--border-subtle)] hover:border-[var(--accent-orange)] 
                             hover:shadow-lg transition-all cursor-pointer"
                >
                  <span className="text-2xl sm:text-3xl">📜</span>
                  <span className="text-xs sm:text-sm text-[var(--text-primary)]">历史记录</span>
                </motion.div>
              </Link>
              
              {/* Points - Requirement 11.3 */}
              <Link href="/points">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-white/60 rounded-xl sm:rounded-2xl 
                             border border-[var(--border-subtle)] hover:border-[var(--accent-orange)] 
                             hover:shadow-lg transition-all cursor-pointer"
                >
                  <span className="text-2xl sm:text-3xl">💰</span>
                  <span className="text-xs sm:text-sm text-[var(--text-primary)]">积分充值</span>
                </motion.div>
              </Link>
              
              {/* Logout - Requirement 11.3 */}
              <motion.button
                onClick={handleLogout}
                disabled={loggingOut}
                whileHover={{ scale: loggingOut ? 1 : 1.05 }}
                className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-white/60 rounded-xl sm:rounded-2xl 
                           border border-[var(--border-subtle)] hover:border-rose-400 
                           hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="text-2xl sm:text-3xl">🚪</span>
                <span className="text-xs sm:text-sm text-[var(--text-primary)]">
                  {loggingOut ? "退出中..." : "退出登录"}
                </span>
              </motion.button>
            </div>
          </StaggerItem>

          {/* Account Info */}
          <StaggerItem
            className="glass-card no-hover-scale p-4 sm:p-6 md:p-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-[var(--text-primary)]">账户信息</h2>
            <div className="space-y-3 sm:space-y-4">
              {session?.user?.username && (
                <div className="flex justify-between items-center py-2 sm:py-3 border-b border-[var(--border-subtle)]">
                  <span className="text-sm sm:text-base text-[var(--text-muted)]">用户名</span>
                  <span className="text-sm sm:text-base text-[var(--text-primary)]">{session.user.username}</span>
                </div>
              )}
              {session?.user?.phone && (
                <div className="flex justify-between items-center py-2 sm:py-3 border-b border-[var(--border-subtle)]">
                  <span className="text-sm sm:text-base text-[var(--text-muted)]">手机号</span>
                  <span className="text-sm sm:text-base text-[var(--text-primary)]">{maskPhone(session.user.phone)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 sm:py-3 border-b border-[var(--border-subtle)]">
                <span className="text-sm sm:text-base text-[var(--text-muted)]">用户ID</span>
                <span className="text-xs sm:text-sm font-mono text-[var(--text-muted)]">
                  {session?.user?.id?.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between items-center py-2 sm:py-3">
                <span className="text-sm sm:text-base text-[var(--text-muted)]">账户状态</span>
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs sm:text-sm border border-emerald-200">
                  正常
                </span>
              </div>
            </div>
          </StaggerItem>

          {/* Logout Button (Mobile) */}
          <StaggerItem className="mt-8 md:hidden">
            <PillButton
              onClick={handleLogout}
              disabled={loggingOut}
              variant="secondary"
              className="w-full text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              {loggingOut ? "退出中..." : "退出登录"}
            </PillButton>
          </StaggerItem>
        </PageTransition>
      </div>
    </div>
  );
}
