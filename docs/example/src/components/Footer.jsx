import { Link } from 'react-router-dom'
import { 
  TwitterLogo, 
  LinkedinLogo, 
  InstagramLogo, 
  YoutubeLogo,
  Envelope,
  Phone,
  MapPin
} from '@phosphor-icons/react'
import styles from './Footer.module.css'

const footerLinks = {
  product: [
    { label: 'Features', path: '/#features' },
    { label: 'Pricing', path: '/#pricing' },
    { label: 'Integrations', path: '/#integrations' },
    { label: 'Changelog', path: '/changelog' },
  ],
  company: [
    { label: 'About Us', path: '/#about' },
    { label: 'Careers', path: '/careers' },
    { label: 'Blog', path: '/blog' },
    { label: 'Press', path: '/press' },
  ],
  resources: [
    { label: 'Documentation', path: '/docs' },
    { label: 'Help Center', path: '/help' },
    { label: 'Community', path: '/community' },
    { label: 'Contact', path: '/#contact' },
  ],
  legal: [
    { label: 'Privacy Policy', path: '/privacy-policy' },
    { label: 'Terms of Service', path: '/terms' },
    { label: 'Cookie Policy', path: '/cookies' },
  ],
}

const socialLinks = [
  { icon: TwitterLogo, href: 'https://twitter.com', label: 'Twitter' },
  { icon: LinkedinLogo, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: InstagramLogo, href: 'https://instagram.com', label: 'Instagram' },
  { icon: YoutubeLogo, href: 'https://youtube.com', label: 'YouTube' },
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
              Task Management Made Simple and Powerful
            </p>
            <div className={styles.contact}>
              <a href="mailto:hello@prismo.com" className={styles.contactItem}>
                <Envelope size={18} weight="fill" />
                hello@prismo.com
              </a>
              <a href="tel:+00000000000" className={styles.contactItem}>
                <Phone size={18} weight="fill" />
                +00 0000 000 00
              </a>
            </div>
          </div>

          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4>Product</h4>
              <ul>
                {footerLinks.product.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4>Company</h4>
              <ul>
                {footerLinks.company.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4>Resources</h4>
              <ul>
                {footerLinks.resources.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.linkGroup}>
              <h4>Legal</h4>
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
            © {new Date().getFullYear()} Prismo. All rights reserved.
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
