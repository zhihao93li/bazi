import { BentoGrid, BentoGridItem } from "./bento-grid";

const FeatureIcon = ({ path }: { path: string }) => (
  <div className="w-12 h-12 rounded-2xl bg-[var(--light-94)] flex items-center justify-center mb-6 text-[var(--dark-7)] group-hover:scale-110 transition-transform duration-300">
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
    </svg>
  </div>
);

const items = [
  {
    title: "AI 智能分析引擎",
    description: "基于深度学习的大语言模型，结合传统命理算法，为您提供更有深度、更具人性化的命理分析报告。",
    iconPath: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    colSpan: 2,
  },
  {
    title: "五行平衡可视化",
    description: "直观的图表展示您的五行强弱分布，让您一目了然地看清命局中的缺失与优势。",
    iconPath: "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z",
    colSpan: 1,
  },
  {
    title: "大运流年时间轴",
    description: "清晰的时间轴展示人生起伏，精准预测未来十年大运走向与流年吉凶。",
    iconPath: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    colSpan: 1,
  },
  {
    title: "多维度生活指南",
    description: "涵盖事业发展、财运趋势、情感婚姻、健康养生等全方位的人生建议。",
    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    colSpan: 2,
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-[1160px] mx-auto px-5">
        <div className="text-center mb-16">
          <h2 className="text-[32px] md:text-[40px] font-semibold text-[var(--dark-7)] mb-4">
            不仅仅是排盘工具
          </h2>
          <p className="text-[var(--grey-50)] text-lg max-w-[600px] mx-auto">
            我们要做的，是为您提供一套完整的命运探索与决策支持系统
          </p>
        </div>

        <BentoGrid className="max-w-5xl mx-auto">
          {items.map((item, i) => (
            <BentoGridItem
              key={i}
              colSpan={item.colSpan as 1 | 2}
              className={`group glass-card p-8 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col items-start`}
            >
              <FeatureIcon path={item.iconPath} />
              <h3 className="text-xl font-semibold text-[var(--dark-7)] mb-3 group-hover:text-[var(--accent-purple)] transition-colors">
                {item.title}
              </h3>
              <p className="text-[var(--grey-50)] leading-relaxed">
                {item.description}
              </p>
            </BentoGridItem>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
