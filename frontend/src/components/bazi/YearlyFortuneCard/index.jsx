import ThemeCard from '../ThemeCard';

/**
 * 流年解读卡片组件
 */
export default function YearlyFortuneCard({
  isUnlocked = false,
  content,
  price = 0,
  isLoading = false,
  onUnlock,
  className = '',
}) {
  const currentYear = new Date().getFullYear();
  
  return (
    <ThemeCard
      theme="yearly_fortune"
      title={`${currentYear}成长建议`}
      price={price}
      isUnlocked={isUnlocked}
      content={content}
      isLoading={isLoading}
      onUnlock={onUnlock}
      className={className}
    />
  );
}
