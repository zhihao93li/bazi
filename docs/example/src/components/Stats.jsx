import { motion } from 'framer-motion'
import { SealCheck, SuitcaseSimple, Lightning } from '@phosphor-icons/react'
import styles from './Stats.module.css'

const stats = [
  {
    icon: null,
    number: '300K+',
    label: 'Team Collaborations',
    hasImages: true
  },
  {
    icon: SealCheck,
    number: '500K+',
    label: 'Tasks Completed'
  },
  {
    icon: SuitcaseSimple,
    number: '15M+',
    label: 'Projects Managed'
  },
  {
    icon: Lightning,
    number: '150K+',
    label: 'Successful Integrations'
  }
]

const slideWords = [
  'Cluttered Dashboards',
  'Missed Deadlines',
  'Endless Meetings',
  'Manual Updates',
  'Lost Files'
]

export default function Stats() {
  return (
    <section className={styles.stats}>
      <div className={styles.container}>
        {/* Wave Goodbye Section */}
        <div className={styles.waveSection}>
          <h2 className={styles.waveTitle}>
            Wave goodbye to
          </h2>
          <div className={styles.slideContainer}>
            <div className={styles.slideTrack}>
              {[...slideWords, ...slideWords].map((word, index) => (
                <span key={index} className={styles.slideWord}>
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              {stat.hasImages ? (
                <div className={styles.avatarStack}>
                  <img 
                    src="https://framerusercontent.com/images/bOZe3ThmdFaGjs87Gu7Fup6M4.png" 
                    alt="User" 
                    className={styles.avatar}
                    style={{ transform: 'rotate(-9deg)' }}
                  />
                  <img 
                    src="https://framerusercontent.com/images/70rKUELh1Zj5uRxlcEji6neFc.png" 
                    alt="User" 
                    className={styles.avatar}
                  />
                  <img 
                    src="https://framerusercontent.com/images/czofpZZGkqkn3CC2oLdJdIIzZ6g.png" 
                    alt="User" 
                    className={styles.avatar}
                    style={{ transform: 'rotate(9deg)' }}
                  />
                </div>
              ) : (
                <div className={styles.iconWrapper}>
                  <div className={styles.iconGradient}>
                    <stat.icon size={30} weight="duotone" color="white" />
                  </div>
                </div>
              )}
              <div className={styles.statText}>
                <span className={styles.statNumber}>{stat.number}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
