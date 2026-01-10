import { motion } from 'framer-motion'
import { 
  TreeStructure, 
  Star, 
  UserCirclePlus, 
  BellRinging,
  Check
} from '@phosphor-icons/react'
import Tag from './Tag'
import styles from './Features.module.css'

const features = [
  {
    icon: TreeStructure,
    color: 'rgb(255, 47, 47)',
    title: 'Timeline View',
    description: 'Visualize tasks and deadlines at a glance.'
  },
  {
    icon: Star,
    color: 'rgb(138, 67, 225)',
    title: 'Project Management',
    description: 'Manage projects with priorities and due dates.'
  },
  {
    icon: UserCirclePlus,
    color: 'rgb(39, 179, 44)',
    title: 'Collaboration',
    description: 'Connect through task comments and updates.'
  },
  {
    icon: BellRinging,
    color: 'rgb(239, 123, 22)',
    title: 'Notifications',
    description: 'Stay updated with alerts for key changes.'
  }
]

const checkpoints = [
  'Interactive Timeline - Track and organize tasks visually.',
  'Custom Fields - Tailor tasks to your workflow.',
  'Real-Time Sync - Stay updated instantly.',
  'Team Comments - Collaborate directly on tasks.'
]

export default function Features() {
  return (
    <section id="features" className={styles.features}>
      <div className={styles.container}>
        {/* First Feature Block */}
        <div className={styles.featureBlock}>
          <motion.div 
            className={styles.content}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.header}>
              <Tag>Task Management</Tag>
              <h2 className={styles.title}>
                All Your Tasks, Organized Effortlessly
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
          </motion.div>

          <motion.div 
            className={styles.imageCard}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src="https://framerusercontent.com/images/QyjdbazPTUU8hu2UwEgcPTgnEo.svg" 
              alt="Task Management"
              className={styles.featureImage}
            />
          </motion.div>
        </div>

        {/* Second Feature Block */}
        <div className={`${styles.featureBlock} ${styles.reverse}`}>
          <motion.div 
            className={styles.imageCard}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src="https://framerusercontent.com/images/wgGuBRTVLu8u6u3dSvRbJZCEgN0.png" 
              alt="Powerful Features"
              className={styles.featureImage}
            />
          </motion.div>

          <motion.div 
            className={styles.content}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.header}>
              <Tag>Powerful Features</Tag>
              <h2 className={styles.title}>
                Work Smarter with Powerful Features
              </h2>
              <p className={styles.description}>
                Effortlessly manage tasks, collaborate with teams, and meet deadlines with precision and clarity.
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
          </motion.div>
        </div>
      </div>

      <div className={styles.abstractLine} />
    </section>
  )
}
