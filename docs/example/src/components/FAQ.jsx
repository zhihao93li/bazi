import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from '@phosphor-icons/react'
import Tag from './Tag'
import Button from './Button'
import styles from './FAQ.module.css'

const faqs = [
  {
    question: 'What is Prismo and how does it work?',
    answer: 'Prismo is a comprehensive task management platform designed to help teams organize, track, and complete projects efficiently. It provides intuitive tools for task creation, team collaboration, progress tracking, and deadline management.'
  },
  {
    question: 'Can I try Prismo for free?',
    answer: 'Yes! We offer a 7-day free trial for all new users. You can explore all features without any commitment or credit card required.'
  },
  {
    question: 'How does team collaboration work?',
    answer: 'Prismo enables real-time collaboration through shared workspaces, task comments, file sharing, and instant notifications. Team members can assign tasks, track progress, and communicate seamlessly within the platform.'
  },
  {
    question: 'Is my data secure with Prismo?',
    answer: 'Absolutely. We use industry-standard encryption and security measures to protect your data. Our platform is SOC 2 compliant and we perform regular security audits to ensure your information remains safe.'
  },
  {
    question: 'Can I integrate Prismo with other tools?',
    answer: 'Yes, Prismo integrates with popular tools like Slack, Google Workspace, Microsoft 365, Zapier, and many more. Our API also allows custom integrations for enterprise clients.'
  },
  {
    question: 'What support options are available?',
    answer: 'We offer email support for all users, priority support for Pro users, and 24/7 dedicated support for Enterprise clients. We also have extensive documentation and a community forum.'
  }
]

function FAQItem({ faq, isOpen, onClick }) {
  return (
    <div className={styles.faqItem}>
      <button className={styles.faqQuestion} onClick={onClick}>
        <span>{faq.question}</span>
        {isOpen ? (
          <Minus size={20} weight="bold" />
        ) : (
          <Plus size={20} weight="bold" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.faqAnswer}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p>{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className={styles.faq}>
      <div className={styles.container}>
        <motion.div 
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Tag>FAQs</Tag>
          <h2 className={styles.title}>Frequently Asked Questions</h2>
        </motion.div>

        <div className={styles.faqList}>
          <div className={styles.faqColumn}>
            {faqs.slice(0, 3).map((faq, index) => (
              <FAQItem
                key={index}
                faq={faq}
                isOpen={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
              />
            ))}
          </div>
          <div className={styles.faqColumn}>
            {faqs.slice(3).map((faq, index) => (
              <FAQItem
                key={index + 3}
                faq={faq}
                isOpen={openIndex === index + 3}
                onClick={() => setOpenIndex(openIndex === index + 3 ? -1 : index + 3)}
              />
            ))}
          </div>
        </div>

        <motion.div 
          className={styles.cta}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.ctaContent}>
            <h3>Have Questions? We're Here to Help!</h3>
            <p>Reach out to our support team for any queries or assistance.</p>
          </div>
          <Button to="/#contact">Contact Us</Button>
        </motion.div>
      </div>
    </section>
  )
}
