import Link from "next/link";

const footerLinks = {
  product: [
    { label: "功能特性", href: "/#features" },
    { label: "价格方案", href: "/#pricing" },
    { label: "API 接口", href: "/api" },
    { label: "更新日志", href: "/changelog" },
  ],
  company: [
    { label: "关于我们", href: "/about" },
    { label: "加入我们", href: "/careers" },
    { label: "博客文章", href: "/blog" },
    { label: "媒体报道", href: "/press" },
  ],
  resources: [
    { label: "使用文档", href: "/docs" },
    { label: "帮助中心", href: "/help" },
    { label: "社区论坛", href: "/community" },
    { label: "联系支持", href: "/contact" },
  ],
  legal: [
    { label: "隐私政策", href: "/privacy" },
    { label: "服务条款", href: "/terms" },
    { label: "Cookie 策略", href: "/cookies" },
  ],
};

const SocialIcon = ({ path }: { path: string }) => (
  <svg
    className="w-5 h-5 text-[var(--grey-50)] hover:text-[var(--dark-7)] transition-colors"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d={path} />
  </svg>
);

export function Footer() {
  return (
    <footer className="relative z-10 pt-20 pb-10 bg-[var(--light-95)]">
      <div className="max-w-[1160px] mx-auto px-5">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
          {/* Logo & Description - Spans 2 cols on large screens */}
          <div className="col-span-2 lg:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">☯</span>
              <span className="text-xl font-semibold text-[var(--dark-7)]">
                八字命理
              </span>
            </Link>
            <p className="text-[15px] text-[var(--grey-50)] leading-relaxed max-w-[300px]">
              结合传统国学智慧与现代 AI 技术，
              <br />
              为您提供科学、精准的命理分析服务。
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Link href="#" aria-label="Twitter">
                <SocialIcon path="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </Link>
              <Link href="#" aria-label="GitHub">
                <SocialIcon path="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </Link>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="font-semibold text-[var(--dark-7)] mb-4">产品</h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-[var(--grey-50)] hover:text-[var(--dark-7)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[var(--dark-7)] mb-4">公司</h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-[var(--grey-50)] hover:text-[var(--dark-7)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[var(--dark-7)] mb-4">资源</h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-[var(--grey-50)] hover:text-[var(--dark-7)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[var(--dark-7)] mb-4">法律</h3>
            <ul className="flex flex-col gap-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-[var(--grey-50)] hover:text-[var(--dark-7)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[14px] text-[var(--grey-50)]">
            © {new Date().getFullYear()} 八字命理. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-[14px] text-[var(--grey-50)] hover:text-[var(--dark-7)] transition-colors"
            >
              隐私政策
            </Link>
            <Link
              href="/terms"
              className="text-[14px] text-[var(--grey-50)] hover:text-[var(--dark-7)] transition-colors"
            >
              服务条款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
