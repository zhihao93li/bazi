import { Link } from 'react-router-dom'
import { Envelope } from '@phosphor-icons/react'
import styles from './Footer.module.css'

const legalLinks = [
  { label: '隐私政策', path: '/privacy-policy' },
  { label: '服务条款', path: '/terms' },
  { label: '退款政策', path: '/refund-policy' },
]

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link to="/" className={styles.logo}>
              <span className={styles.logoText}>她赋</span>
            </Link>
            <p className={styles.tagline}>
              她的力量，自成诗赋
            </p>
            <div className={styles.contact}>
              <a href="mailto:tafuofficial@gmail.com" className={styles.contactItem}>
                <Envelope size={18} weight="fill" />
                tafuofficial@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © 2026 CHONGSEN HONGKONG LIMITED. All rights reserved.
          </p>
          <div className={styles.legalLinks}>
            {legalLinks.map((link, index) => (
              <span key={link.label}>
                <Link to={link.path}>{link.label}</Link>
                {index < legalLinks.length - 1 && <span className={styles.separator}>·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
