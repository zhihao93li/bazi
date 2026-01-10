import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from '@phosphor-icons/react'
import Tag from './Tag'
import Button from './Button'
import styles from './Pricing.module.css'

const plans = [
  {
    name: 'Basic',
    description: 'Perfect for individuals and small teams getting started.',
    monthlyPrice: 9,
    yearlyPrice: 90,
    features: [
      'Up to 5 team members',
      '10 projects',
      'Basic task management',
      'Email support',
      '1GB storage'
    ]
  },
  {
    name: 'Pro',
    description: 'Best for growing teams that need more power.',
    monthlyPrice: 29,
    yearlyPrice: 290,
    popular: true,
    features: [
      'Up to 20 team members',
      'Unlimited projects',
      'Advanced task management',
      'Priority support',
      '10GB storage',
      'Custom workflows',
      'Analytics dashboard'
    ]
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with custom needs.',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      'Unlimited team members',
      'Unlimited projects',
      'Enterprise features',
      '24/7 dedicated support',
      'Unlimited storage',
      'Custom integrations',
      'Advanced security',
      'SLA guarantee'
    ]
  }
]

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing" className={styles.pricing}>
      <div className={styles.container}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Tag>Pricing & Plans</Tag>
          <h2 className={styles.title}>Affordable Pricing Plans</h2>
          <p className={styles.subtitle}>
            Flexible, transparent pricing to support your team's productivity and growth at every stage.
          </p>

          <div className={styles.toggle}>
            <button 
              className={`${styles.toggleBtn} ${!isYearly ? styles.active : ''}`}
              onClick={() => setIsYearly(false)}
            >
              Monthly
            </button>
            <button 
              className={`${styles.toggleBtn} ${isYearly ? styles.active : ''}`}
              onClick={() => setIsYearly(true)}
            >
              Yearly
              <span className={styles.discount}>Save 20%</span>
            </button>
          </div>
        </motion.div>

        <div className={styles.plans}>
          {plans.map((plan, index) => (
            <motion.div 
              key={plan.name}
              className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              {plan.popular && (
                <div className={styles.popularBadge}>Most Popular</div>
              )}
              
              <div className={styles.planHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>
              </div>

              <div className={styles.priceWrapper}>
                <span className={styles.currency}>$</span>
                <span className={styles.price}>
                  {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className={styles.period}>
                  /{isYearly ? 'year' : 'month'}
                </span>
              </div>

              <ul className={styles.features}>
                {plan.features.map((feature, i) => (
                  <li key={i} className={styles.feature}>
                    <Check size={18} weight="bold" className={styles.checkIcon} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.popular ? 'primary' : 'secondary'}
                to="/waitlist"
                className={styles.planButton}
              >
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
