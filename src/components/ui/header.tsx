"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/bazi", label: "八字排盘" },
  { href: "/history", label: "历史记录" },
  { href: "/points", label: "积分充值" },
  { href: "/profile", label: "用户中心" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 w-full max-w-[1160px] z-[1000] px-5">
      <div className="flex items-center justify-between bg-white rounded-full py-2 pl-6 pr-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">☯</span>
          <span className="text-xl font-semibold text-[var(--dark-7)]">
            八字命理
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-[15px] font-medium transition-all duration-200 ${
                    pathname === item.href
                      ? "text-[var(--accent-orange)]"
                      : "text-[var(--dark-7)] hover:bg-[var(--light-94)]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/bazi/input"
            className="inline-flex items-center justify-center px-6 py-3 bg-[var(--dark-7)] text-white text-[15px] font-medium rounded-full transition-all duration-200 hover:bg-[var(--grey-24)] hover:-translate-y-0.5"
          >
            立即排盘
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden p-2 text-[var(--dark-7)]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="absolute top-full left-5 right-5 mt-2.5 bg-white rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] md:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ul className="flex flex-col gap-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      pathname === item.href
                        ? "bg-[var(--light-94)] text-[var(--accent-orange)]"
                        : "text-[var(--dark-7)] hover:bg-[var(--light-94)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2">
                <Link
                  href="/bazi/input"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-3.5 px-6 bg-[var(--dark-7)] text-white text-base font-medium rounded-full"
                >
                  立即排盘
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
