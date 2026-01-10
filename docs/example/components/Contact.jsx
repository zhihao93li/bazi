import { useState } from 'react'
import { motion } from 'framer-motion'
import { Envelope, Phone, MapPin } from '@phosphor-icons/react'
import Tag from './Tag'
import Button from './Button'
import styles from './Contact.module.css'

const contactInfo = [
  {
    icon: Envelope,
    label: 'hello@prismo.com',
    action: 'Email Us',
    href: 'mailto:hello@prismo.com'
  },
  {
    icon: Phone,
    label: '+00 0000 000 00',
    action: 'Call Us',
    href: 'tel:+00000000000'
  },
  {
    icon: MapPin,
    label: 'Office',
    action: 'Get Direction',
    href: 'https://maps.google.com'
  }
]

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    email: '',
    message: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // Handle form submission
  }

  return (
    <section id="contact" className={styles.contact}>
      <div className={styles.container}>
        <motion.div 
          className={styles.info}
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.header}>
            <Tag>Contact</Tag>
            <h2 className={styles.title}>We'd Love to Hear From You</h2>
            <p className={styles.subtitle}>
              Contact us for inquiries, support, or feedback. We're here to assist you every step of the way.
            </p>
          </div>

          <div className={styles.contactList}>
            {contactInfo.map((item, index) => (
              <div key={index} className={styles.contactItem}>
                <div className={styles.contactContent}>
                  <item.icon size={25} weight="fill" />
                  <span>{item.label}</span>
                </div>
                <Button 
                  href={item.href}
                  size="small"
                  className={styles.contactButton}
                >
                  {item.action}
                </Button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className={styles.formWrapper}
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <form className={styles.form} onSubmit={handleSubmit}>
            <h3 className={styles.formTitle}>Send us your query</h3>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Subject"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">E-Mail</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your message..."
                rows={4}
                required
              />
            </div>

            <Button type="submit">Send Your Message</Button>
          </form>
        </motion.div>
      </div>
    </section>
  )
}
