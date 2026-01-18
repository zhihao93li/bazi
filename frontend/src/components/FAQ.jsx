import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from '@phosphor-icons/react'
import Tag from './Tag'
import Button from './Button'
import styles from './FAQ.module.css'

const faqs = [
  {
    question: '排盘结果准确吗？',
    answer: '我们的系统基于经典的《三命通会》、《渊海子平》等命理典籍算法，并结合天文数据进行真太阳时校正，确保排盘数据的学术准确性。'
  },
  {
    question: 'AI 解读与传统算命有什么区别？',
    answer: '传统算命依赖个人经验，质量参差不齐。我们的 AI 经过大量命理数据训练，能够提供客观、全面且逻辑严密的分析，同时能够用通俗的语言解释专业术语。'
  },
  {
    question: '我的隐私数据安全吗？',
    answer: '绝对安全。您的出生信息仅用于生成命盘分析，我们严格遵守隐私保护协议，不会将您的个人数据泄露给第三方。'
  },
  {
    question: '可以测算多少次？',
    answer: '注册用户每天拥有免费的排盘额度。如果需要进行深度的 AI 详细解读报告，需要消耗相应的积分，新用户注册即送 100 积分。'
  },
  {
    question: '支持哪些支付方式充值积分？',
    answer: '目前支持支付宝和微信支付进行积分充值。充值后的积分永久有效。'
  },
  {
    question: '解读报告看不懂怎么办？',
    answer: 'AI 解读旨在通俗易懂。如果您对某些部分仍有疑问，可以重新生成分析或参考我们的帮助文档中的术语解释。'
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
          <m.div
            className={styles.faqAnswer}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p>{faq.answer}</p>
          </m.div>
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
        <m.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Tag>常见问题</Tag>
          <h2 className={styles.title}>关于八字命理的疑问</h2>
        </m.div>

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

        <m.div
          className={styles.cta}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.ctaContent}>
            <h3>准备好探索您的命运了吗？</h3>
            <p>立即开始免费排盘，发现未知的自己。</p>
          </div>
          <Button to="/bazi">立即体验</Button>
        </m.div>
      </div>
    </section>
  )
}
