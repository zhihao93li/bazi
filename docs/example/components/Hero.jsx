import { motion } from 'framer-motion'
import { GoogleLogo, Star, StarHalf } from '@phosphor-icons/react'
import Button from './Button'
import styles from './Hero.module.css'

// Generate grid lines
const gridLines = Array.from({ length: 24 }, (_, i) => i)

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.background}>
        {/* Left Abstract - Two groups of ellipses */}
        <div className={styles.leftAbstract}>
          <div className={styles.ellipseGroup}>
            <div className={styles.ellipse} style={{ background: 'rgba(138, 67, 225, 1)', top: '207px', left: '0' }} />
            <div className={styles.ellipse} style={{ background: 'rgba(213, 17, 253, 1)', top: '363px', left: '37px' }} />
            <div className={styles.ellipse} style={{ background: 'rgba(239, 123, 22, 1)', top: '0', left: '213px' }} />
            <div className={styles.ellipse} style={{ background: 'rgba(255, 47, 47, 1)', top: '80px', left: '9px' }} />
          </div>
          <div className={styles.ellipseGroup}>
            <div className={styles.ellipse} style={{ background: 'rgba(138, 67, 225, 1)', top: '207px', left: '0' }} />
            <div className={styles.ellipse} style={{ background: 'rgba(213, 17, 253, 1)', top: '363px', left: '37px' }} />
            <div className={styles.ellipse} style={{ background: 'rgba(239, 123, 22, 1)', top: '0', left: '213px' }} />
            <div className={styles.ellipse} style={{ background: 'rgba(255, 47, 47, 1)', top: '80px', left: '9px' }} />
          </div>
        </div>
        
        {/* Right Abstract - Two groups of ellipses */}
        <div className={styles.rightAbstract}>
          <div className={styles.ellipseGroup}>
            <div className={styles.ellipse} style={{ background: 'rgba(138, 67, 225, 1)', top: '207px', left: '0' }} />
            <div className={styles.ellipse} style={{ background: 'rgba(213, 17, 253, 1)', top: '363px', left: '37px' }} />
            <div className={styles.ellipse} style={{ background: 'rgba(239, 123, 22, 1)', top: '0', left: '213px' }} />
            <div className={styles.ellipse} style={{ background: 'rgba(255, 47, 47, 1)', top: '80px', left: '9px' }} />
          </div>
          <div className={styles.ellipseGroup} style={{ transform: 'rotate(-25deg)', top: '20px', left: '-50px' }}>
            <div className={styles.ellipse} style={{ background: 'rgba(138, 67, 225, 1)', top: '207px', left: '0' }} />
            <div className={styles.ellipse} style={{ background: 'rgba(213, 17, 253, 1)', top: '363px', left: '37px' }} />
            <div className={styles.ellipse} style={{ background: 'rgba(239, 123, 22, 1)', top: '0', left: '213px' }} />
            <div className={styles.ellipse} style={{ background: 'rgba(255, 47, 47, 1)', top: '80px', left: '9px' }} />
          </div>
        </div>
        
        {/* Vertical Grid Lines */}
        <div className={styles.gridLines}>
          {gridLines.map((i) => (
            <div key={i} className={styles.gridLine} />
          ))}
        </div>
        
        {/* Gradient overlays */}
        <div className={styles.bgGradientTop} />
        <div className={styles.bgGradient} />
        
        {/* Noise texture */}
        <div className={styles.noise} />
      </div>

      <div className={styles.container}>
        <motion.div 
          className={styles.content}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.badge}>
            <span className={styles.badgeNumber}>200K+</span>
            <span className={styles.badgeText}>Projects Managed Daily with Prismo</span>
          </div>

          <div className={styles.textContent}>
            <h1 className={styles.title}>
              Task Management Made Simple and Powerful
            </h1>
            <p className={styles.subtitle}>
              Boost productivity with seamless task and team management.
            </p>
          </div>

          <div className={styles.cta}>
            <Button to="/waitlist" size="large">
              Join Waitlist
            </Button>
            
            <div className={styles.rating}>
              <div className={styles.stars}>
                <GoogleLogo size={18} weight="bold" />
                <Star size={14} weight="fill" />
                <Star size={14} weight="fill" />
                <Star size={14} weight="fill" />
                <Star size={14} weight="fill" />
                <StarHalf size={14} weight="fill" />
              </div>
              <div className={styles.divider} />
              <span className={styles.ratingText}>4.9 rating Based on 300k Users</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className={styles.imageContainer}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className={styles.imageWrapper}>
            <img 
              src="https://framerusercontent.com/images/BesZqi2DRImbj4FXrPED12W5zA.png" 
              alt="Prismo Dashboard"
              className={styles.dashboardImage}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
