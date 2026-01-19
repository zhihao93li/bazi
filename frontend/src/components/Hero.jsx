import { useState, useEffect } from 'react'
import { m } from 'framer-motion'

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
        <m.div
          className={styles.content}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.badge}>
            <span className={styles.badgeNumber}>她</span>
            <span className={styles.badgeText}>的力量，自成诗赋</span>
          </div>

          <div className={styles.textContent}>
            <h1 className={styles.title}>
              她赋｜女性个人洞察工具
            </h1>
            <p className={styles.subtitle}>
              以传统命理为结构，以现代女性的视角重新解读人生
            </p>
          </div>

          <div className={styles.cta}>
            <Button to="/bazi" size="large">
              开始探索
            </Button>


          </div>
        </m.div>

        <m.div
          className={styles.imageContainer}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className={`${styles.imageWrapper} ${isScrolled ? styles.imageWrapperScrolled : ''}`}>
            <img
              src="/heropic.png"
              alt="她赋命盘分析界面"
              className={styles.dashboardImage}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            {/* 底部渐变蒙版，让图片与背景自然融合 */}
            <div className={styles.imageOverlay} />
          </div>
        </m.div>
      </div>
    </section>
  )
}
