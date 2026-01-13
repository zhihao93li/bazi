import ThemeCard from '../ThemeCard';

/**
 * 生命底色卡片组件
 */
export default function LifeColorCard({
  isUnlocked = false,
  content,
  price = 0,
  isLoading = false,
  onUnlock,
  className = '',
}) {
  return (
    <ThemeCard
      theme="life_color"
      title="生命底色"
      price={price}
      isUnlocked={isUnlocked}
      content={content}
      isLoading={isLoading}
      onUnlock={onUnlock}
      className={className}
    />
  );
}
