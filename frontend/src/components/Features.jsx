import { m } from 'framer-motion'
import { Check } from '@phosphor-icons/react'
import Tag from './Tag'
import styles from './Features.module.css'

const checkpoints = [
  '智能真太阳时校正 - 确保分析模型参数精准无误。',
  '多维度五行分析 - 直观展示五行能量分布。',
  '大语言模型驱动 - 提供有温度的文字解读。',
  '隐私安全保护 - 您的数据仅用于报告生成服务。'
]

export default function Features() {
  return (
    <section id="features" className={styles.features}>
      <div className={styles.container}>
        {/* AI Feature Block */}
        <div className={styles.featureBlock}>
          <m.div
            className={styles.content}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.header}>
              <h2 className={styles.title}>
                看得懂的个人特质洞察
              </h2>
              <p className={styles.description}>
                结合传统理论与现代方法建模，融合深度自然语言处理技术，打破传统人工解读的局限与主观偏见，为你提供零延迟、无偏见、极度细腻的深度报告。
              </p>
            </div>

            <div className={styles.checkpoints}>
              {checkpoints.map((point, index) => (
                <div key={index} className={styles.checkpoint}>
                  <div className={styles.checkIcon}>
                    <Check size={16} weight="bold" />
                  </div>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </m.div>

          <m.div
            className={styles.imageCard}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <img
              src="/images/intro.png"
              alt="AI Analysis"
              className={styles.featureImage}
              loading="lazy"
              decoding="async"
            />
          </m.div>
        </div>
      </div>

      <div className={styles.abstractLine} />
    </section>
  )
}
