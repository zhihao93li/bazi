import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GoogleLogo, Star, StarHalf } from '@phosphor-icons/react'
import Button from './Button'
import GradientBackground from './GradientBackground'
import styles from './Hero.module.css'

export default function Hero() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // 滚动 1px 就开始触发放大
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className={styles.hero}>
      <GradientBackground />

      <div className={styles.container}>
        <motion.div 
          className={styles.content}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.badge}>
            <span className={styles.badgeNumber}>200K+</span>
            <span className={styles.badgeText}>次排盘记录 · 持续增长中</span>
          </div>

          <div className={styles.textContent}>
            <h1 className={styles.title}>
              AI 驱动的专业八字命理分析
            </h1>
            <p className={styles.subtitle}>
              融合传统周易智慧与现代人工智能，为您提供精准的四柱排盘、
              深度的性格剖析与人生运势解读。
            </p>
          </div>

          <div className={styles.cta}>
            <Button to="/bazi/input" size="large">
              立即排盘
            </Button>
            
            <div className={styles.rating}>
              <div className={styles.stars}>
                <Star size={14} weight="fill" color="var(--accent-orange)" />
                <Star size={14} weight="fill" color="var(--accent-orange)" />
                <Star size={14} weight="fill" color="var(--accent-orange)" />
                <Star size={14} weight="fill" color="var(--accent-orange)" />
                <Star size={14} weight="fill" color="var(--accent-orange)" />
              </div>
              <div className={styles.divider} />
              <span className={styles.ratingText}>4.9 分好评 · 基于 30k+ 用户反馈</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className={styles.imageContainer}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className={`${styles.imageWrapper} ${isScrolled ? styles.imageWrapperScrolled : ''}`}>
            {/* 使用一个代表命理/数据的抽象图或仪表盘截图占位 */}
            <img 
              src="https://framerusercontent.com/images/BesZqi2DRImbj4FXrPED12W5zA.png" 
              alt="Bazi Dashboard"
              className={styles.dashboardImage}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
