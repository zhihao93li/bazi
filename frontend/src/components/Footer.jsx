import { Link } from 'react-router-dom'
import { 
  TwitterLogo, 
  LinkedinLogo, 
  InstagramLogo, 
  Envelope,
  Globe
} from '@phosphor-icons/react'
import styles from './Footer.module.css'

const footerLinks = {
  product: [
    { label: '八字排盘', path: '/bazi/input' },
    { label: '历史记录', path: '/history' },
    { label: '积分充值', path: '/points' },
  ],
  company: [
    { label: '关于我们', path: '/' },
    { label: '联系方式', path: '/' },
    { label: '加入我们', path: '/' },
  ],
  resources: [
    { label: '使用指南', path: '/' },
    { label: '命理百科', path: '/' },
    { label: '帮助中心', path: '/' },
  ],
  legal: [
    { label: '隐私政策', path: '/privacy-policy' },
    { label: '服务条款', path: '/terms' },
  ],
}

const socialLinks = [
  { icon: TwitterLogo, href: '#', label: 'Twitter' },
  { icon: InstagramLogo, href: '#', label: 'Instagram' },
  { icon: Globe, href: '#', label: 'Website' },
]

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link to="/" className={styles.logo}>
              <img 
                src="https://framerusercontent.com/images/E65CrTfgroEJwcxOOIN1vzXb5w.svg" 
                alt="Prismo" 
              />
            </Link>
            <p className={styles.tagline}>
              用科技传承智慧，用 AI 解读命运。
            </p>
            <div className={styles.contact}>
              <a href="mailto:support@bazi.ai" className={styles.contactItem}>
                <Envelope size={18} weight="fill" />
                support@bazi.ai
              </a>
            </div>
          </div>

          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4>产品服务</h4>
              <ul>
                {footerLinks.product.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4>关于公司</h4>
              <ul>
                {footerLinks.company.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4>资源中心</h4>
              <ul>
                {footerLinks.resources.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4>法律条款</h4>
              <ul>
                {footerLinks.legal.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Prismo Bazi. All rights reserved.
          </p>
          <div className={styles.social}>
            {socialLinks.map((social) => (
              <a 
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label={social.label}
              >
                <social.icon size={20} weight="fill" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
