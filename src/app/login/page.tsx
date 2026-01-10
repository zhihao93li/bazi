"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

type LoginMode = "phone" | "username";
type FormMode = "login" | "register";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/bazi";

  // Login mode: phone or username
  const [loginMode, setLoginMode] = useState<LoginMode>("phone");
  // Form mode: login or register (only for username mode)
  const [formMode, setFormMode] = useState<FormMode>("login");

  // Phone login state
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);

  // Username login/register state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Clear form when switching modes
  useEffect(() => {
    setError("");
    setSuccess("");
  }, [loginMode, formMode]);

  // Validate phone format
  const isValidPhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  // Validate username format
  const isValidUsername = (username: string) => {
    return /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(username);
  };

  // Send verification code
  const handleSendCode = async () => {
    if (!isValidPhone(phone)) {
      setError("请输入正确的手机号");
      return;
    }

    setSendingCode(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("验证码已发送");
        setCountdown(60);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "发送失败，请稍后重试");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSendingCode(false);
    }
  };

  // Handle phone login
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidPhone(phone)) {
      setError("请输入正确的手机号");
      return;
    }

    if (!code || code.length !== 6) {
      setError("请输入6位验证码");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn("phone-credentials", {
        phone,
        code,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // Handle username login
  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setError("请输入用户名和密码");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn("username-credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // Handle username registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidUsername(username)) {
      setError("用户名必须以字母开头，3-20位字母、数字或下划线");
      return;
    }

    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("注册成功，正在登录...");
        // Auto login after registration
        const result = await signIn("username-credentials", {
          username,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
        } else {
          router.push(callbackUrl);
        }
      } else {
        setError(data.message || "注册失败，请稍后重试");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <span className="text-3xl">☯</span>
              <span className="text-2xl font-bold gradient-text">八字命理</span>
            </Link>
            <h1 className="text-2xl font-semibold mb-2">
              {loginMode === "phone"
                ? "登录 / 注册"
                : formMode === "login"
                  ? "账号登录"
                  : "注册账号"}
            </h1>
          </div>

          {/* Login Mode Tabs */}
          <div className="flex mb-6 bg-white/5 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setLoginMode("phone")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${loginMode === "phone"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white"
                }`}
            >
              手机号登录
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("username")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${loginMode === "username"
                ? "bg-purple-600 text-white"
                : "text-gray-400 hover:text-white"
                }`}
            >
              账号密码
            </button>
          </div>

          {/* Phone Login Form */}
          {loginMode === "phone" && (
            <form onSubmit={handlePhoneLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  手机号
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="请输入手机号"
                  className="input-glass"
                  maxLength={11}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  验证码
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="请输入验证码"
                    className="flex-1 input-glass"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || sendingCode || !isValidPhone(phone)}
                    className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-medium hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                  >
                    {sendingCode
                      ? "发送中..."
                      : countdown > 0
                        ? `${countdown}s`
                        : "获取验证码"}
                  </button>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm"
                >
                  {success}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading || !isValidPhone(phone) || code.length !== 6}
                className="w-full btn-primary py-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    登录中...
                  </span>
                ) : (
                  "登录"
                )}
              </button>

              <div className="text-center text-sm text-gray-500">
                <p>新用户首次登录自动注册</p>
                <p className="mt-1">注册即送 100 积分</p>
              </div>
            </form>
          )}

          {/* Username Login/Register Form */}
          {loginMode === "username" && (
            <>
              {/* Login/Register Toggle */}
              <div className="flex mb-5 text-sm">
                <button
                  type="button"
                  onClick={() => setFormMode("login")}
                  className={`flex-1 py-2 border-b-2 transition-all ${formMode === "login"
                    ? "border-purple-500 text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                >
                  登录
                </button>
                <button
                  type="button"
                  onClick={() => setFormMode("register")}
                  className={`flex-1 py-2 border-b-2 transition-all ${formMode === "register"
                    ? "border-purple-500 text-white"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                >
                  注册
                </button>
              </div>

              <form
                onSubmit={formMode === "login" ? handleUsernameLogin : handleRegister}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.slice(0, 20))}
                    placeholder="请输入用户名"
                    className="w-full input-glass"
                    maxLength={20}
                  />
                  {formMode === "register" && (
                    <p className="mt-1 text-xs text-gray-500">
                      字母开头，3-20位字母、数字或下划线
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    密码
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full input-glass"
                  />
                  {formMode === "register" && (
                    <p className="mt-1 text-xs text-gray-500">密码至少6位</p>
                  )}
                </div>

                {formMode === "register" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      确认密码
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="请再次输入密码"
                      className="w-full input-glass"
                    />
                  </div>
                )}

                {/* Error/Success Messages */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm"
                  >
                    {success}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading || !username || !password || (formMode === "register" && !confirmPassword)}
                  className="w-full btn-primary py-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {formMode === "login" ? "登录中..." : "注册中..."}
                    </span>
                  ) : (
                    formMode === "login" ? "登录" : "注册"
                  )}
                </button>

                {formMode === "register" && (
                  <div className="text-center text-sm text-gray-500">
                    <p>注册即送 100 积分</p>
                  </div>
                )}
              </form>
            </>
          )}
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回首页
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
