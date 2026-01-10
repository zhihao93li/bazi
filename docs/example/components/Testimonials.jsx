import { motion } from 'framer-motion'
import Tag from './Tag'
import styles from './Testimonials.module.css'

const testimonials = [
  {
    quote: "Prismo has completely transformed how our team manages tasks. The platform has made our workflow seamless and boosted overall productivity.",
    name: "John Matthews",
    role: "Project Manager"
  },
  {
    quote: "With Prismo, we've streamlined our project management, reducing time spent on administrative tasks. It's user-friendly, and our team is now more efficient than ever.",
    name: "Sarah Collins",
    role: "Operations Lead"
  },
  {
    quote: "We saw a massive improvement in our team's collaboration and communication. Prismo helped us organize tasks efficiently, leading to better outcomes across all projects.",
    name: "David Chen",
    role: "Team Lead"
  },
  {
    quote: "We've increased our efficiency by at least 40% since implementing Prismo. It's helped our team stay aligned and deliver exceptional results.",
    name: "Olivia Turner",
    role: "Operations Director"
  }
]

const stats = [
  { number: '10X', label: 'Revenue Boost', color: 'rgb(253, 241, 231)' },
  { number: '2X', label: 'Increase Efficiency', color: 'rgb(244, 231, 253)' },
  { number: '5X', label: 'Team Growth', color: 'rgb(241, 253, 231)' },
  { number: '3X', label: 'Increased Productivity', color: 'rgb(253, 231, 231)' }
]

export default function Testimonials() {
  return (
    <section className={styles.testimonials}>
      <div className={styles.container}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Tag>Testimonials</Tag>
          <h2 className={styles.title}>
            What Our Users Are Saying About Us
          </h2>
        </motion.div>

        <div className={styles.grid}>
          {/* Stats Cards */}
          <motion.div 
            className={styles.statCard}
            style={{ background: stats[0].color }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <span className={styles.statNumber}>{stats[0].number}</span>
            <span className={styles.statLabel}>{stats[0].label}</span>
          </motion.div>

          <motion.div 
            className={styles.statCard}
            style={{ background: stats[1].color }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <span className={styles.statNumber}>{stats[1].number}</span>
            <span className={styles.statLabel}>{stats[1].label}</span>
          </motion.div>

          {/* Testimonial Cards */}
          {testimonials.slice(0, 2).map((testimonial, index) => (
            <motion.div 
              key={index}
              className={styles.testimonialCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (index + 2) * 0.1 }}
            >
              <p className={styles.quote}>"{testimonial.quote}"</p>
              <div className={styles.author}>
                <span className={styles.name}>{testimonial.name}</span>
                <span className={styles.role}>{testimonial.role}</span>
              </div>
            </motion.div>
          ))}

          {testimonials.slice(2, 4).map((testimonial, index) => (
            <motion.div 
              key={index + 2}
              className={styles.testimonialCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (index + 4) * 0.1 }}
            >
              <p className={styles.quote}>"{testimonial.quote}"</p>
              <div className={styles.author}>
                <span className={styles.name}>{testimonial.name}</span>
                <span className={styles.role}>{testimonial.role}</span>
              </div>
            </motion.div>
          ))}

          <motion.div 
            className={styles.statCard}
            style={{ background: stats[2].color }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <span className={styles.statNumber}>{stats[2].number}</span>
            <span className={styles.statLabel}>{stats[2].label}</span>
          </motion.div>

          <motion.div 
            className={styles.statCard}
            style={{ background: stats[3].color }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <span className={styles.statNumber}>{stats[3].number}</span>
            <span className={styles.statLabel}>{stats[3].label}</span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
