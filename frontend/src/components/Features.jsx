import { m } from 'framer-motion'
import { 
  Compass, 
  Brain, 
  TrendUp, 
  UsersThree,
  Check
} from '@phosphor-icons/react'
import Tag from './Tag'
import styles from './Features.module.css'

const features = [
  {
    icon: Compass,
    color: 'rgb(255, 47, 47)',
    title: '精准排盘',
    description: '支持真太阳时校正，精确计算四柱八字与五行强弱。'
  },
  {
    icon: Brain,
    color: 'rgb(138, 67, 225)',
    title: 'AI 深度解读',
    description: '超越传统模板，提供个性化的性格、事业与情感分析。'
  },
  {
    icon: TrendUp,
    color: 'rgb(39, 179, 44)',
    title: '大运流年',
    description: '可视化大运时间轴，助您把握人生起伏与关键转折点。'
  },
  {
    icon: UsersThree,
    color: 'rgb(239, 123, 22)',
    title: '亲友管理',
    description: '轻松管理家人朋友的命盘信息，一键切换查看。'
  }
]

const checkpoints = [
  '智能真太阳时校正 - 确保排盘数据精准无误。',
  '多维度五行分析 - 直观展示五行能量分布。',
  '大语言模型驱动 - 提供有温度的文字解读。',
  '隐私安全保护 - 您的数据仅用于测算服务。'
]

export default function Features() {
  return (
    <section id="features" className={styles.features}>
      <div className={styles.container}>
        {/* First Feature Block */}
        <div className={styles.featureBlock}>
          <m.div 
            className={styles.content}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.header}>
              <Tag>专业排盘</Tag>
              <h2 className={styles.title}>
                传统智慧，现代演绎
              </h2>
            </div>

            <div className={styles.featureGrid}>
              {features.map((feature, index) => (
                <div key={index} className={styles.featureItem}>
                  <feature.icon size={30} weight="duotone" color={feature.color} />
                  <div className={styles.featureText}>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
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
              src="https://framerusercontent.com/images/QyjdbazPTUU8hu2UwEgcPTgnEo.svg" 
              alt="Features"
              className={styles.featureImage}
              loading="lazy"
              decoding="async"
            />
          </m.div>
        </div>

        {/* Second Feature Block */}
        <div className={`${styles.featureBlock} ${styles.reverse}`}>
          <m.div 
            className={styles.imageCard}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src="https://framerusercontent.com/images/wgGuBRTVLu8u6u3dSvRbJZCEgN0.png" 
              alt="AI Analysis"
              className={styles.featureImage}
              loading="lazy"
              decoding="async"
            />
          </m.div>

          <m.div 
            className={styles.content}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.header}>
              <Tag>AI 赋能</Tag>
              <h2 className={styles.title}>
                看得懂的命理分析
              </h2>
              <p className={styles.description}>
                告别晦涩难懂的古文术语。我们使用先进的 AI 技术，将复杂的命理逻辑转化为通俗易懂的建议，助您做出更好的决策。
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
        </div>
      </div>

      <div className={styles.abstractLine} />
    </section>
  )
}
